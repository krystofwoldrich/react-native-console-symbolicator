import symbolicateStackTrace from 'react-native/Libraries/Core/Devtools/symbolicateStackTrace';
import parseErrorStack from 'react-native/Libraries/Core/Devtools/parseErrorStack';

type ConsoleLogFunction = (...args: unknown[]) => void;

/**
 * Installs a console symbolicator that will symbolicate stack traces in console
 * logs, making it easier to debug errors in React Native applications.
 *
 * This function should be called at the start of your application, typically
 * in the entry file (e.g., `_layout.tsx` or `App.tsx`).
 *
 * @param {Object} options - Configuration options for the symbolicator.
 * @param {boolean} [options.excludeReactNativeCoreFrames=false] - If set to `true`,
 *   the symbolicator will drop frames from `node_modules/react-native`
 *   package. This helps readability of the stack trace, but information
 *   about the internal React Native Core stack is lost.
 *
 * @example
 * installConsoleSymbolicator({ excludeReactNativeCoreFrames: true });
 */
export const installConsoleSymbolicator = ({
  excludeReactNativeCoreFrames = false,
}: {
  /**
   * If set to `true`,
   * the symbolicator will drop frames from `node_modules/react-native`
   * package. This helps readability of the stack trace, but information
   * about the internal React Native Core stack is lost.
   *
   * @default false
   *
   * @example
   * installConsoleSymbolicator({ excludeReactNativeCoreFrames: true });
   */
  excludeReactNativeCoreFrames?: boolean;
} = {}) => {
  if (!__DEV__) {
    return;
  }

  const originalConsole = {
    error: console.error,
    warn: console.warn,
    log: console.log,
    info: console.info,
    debug: console.debug,
    assert: console.assert,
  };

  const makeSymbolicatedConsole = (fn: ConsoleLogFunction) =>
    symbolicatedConsole(fn, {
      logError: originalConsole.error,
      excludeReactNativeCoreFrames,
    });

  console.error = makeSymbolicatedConsole(originalConsole.error);
  console.warn = makeSymbolicatedConsole(originalConsole.warn);
  console.log = makeSymbolicatedConsole(originalConsole.log);
  console.info = makeSymbolicatedConsole(originalConsole.info);
  console.debug = makeSymbolicatedConsole(originalConsole.debug);
  console.assert = makeSymbolicatedConsole(
    originalConsole.assert as ConsoleLogFunction
  );
};

const symbolicatedConsole =
  (
    original: ConsoleLogFunction,
    {
      logError,
      excludeReactNativeCoreFrames,
    }: {
      logError: ConsoleLogFunction;
      excludeReactNativeCoreFrames: boolean;
    }
  ) =>
  async (...args: unknown[]) => {
    const symbolicating: Array<Promise<unknown>> = args.map(async (arg) => {
      if (!(arg instanceof Error) || !arg.stack) {
        return arg;
      }

      // Symbolication works only with the dev server running
      try {
        // @ts-ignore = the TS types are broken, the function returns object with `stack` property and a code snippet
        const { stack: frames } = await symbolicateStackTrace(
          // @ts-ignore - the TS types are broken, the function requires the stack string not the error object
          parseErrorStack(arg.stack)
        );

        if (!frames || frames.length === 0) {
          return arg;
        }

        const newStack = frames
          .map(
            (frame: {
              // FIXME: (@krystofwoldrich) Remove when RN types are fixed
              methodName: string;
              file: string | null | undefined;
              lineNumber: number | null | undefined;
              column: number | null | undefined;
            }) => {
              const fileInfo =
                frame.file != null && frame.file.length > 0
                  ? `${frame.file}:${frame.lineNumber || 0}:${frame.column || 0}`
                  : 'unknown';
              return `    at ${frame.methodName} (${fileInfo})`;
            }
          )
          .filter(
            (line: string) =>
              !excludeReactNativeCoreFrames ||
              !line.includes('node_modules/react-native')
          )
          .join('\n');

        arg.stack = arg.message ? `${arg.message}\n${newStack}` : newStack;
      } catch (Oo) {
        logError('Error during symbolication:', Oo);
      }

      return arg;
    });

    const symbolicated = await Promise.all(symbolicating);

    original(...symbolicated);
  };
