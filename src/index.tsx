import symbolicateStackTrace from 'react-native/Libraries/Core/Devtools/symbolicateStackTrace';
import parseErrorStack from 'react-native/Libraries/Core/Devtools/parseErrorStack';

type ConsoleLogFunction = (...args: unknown[]) => void;

export const installConsoleSymbolicator = ({
  excludeReactNativeCoreFrames = false,
}: {
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
