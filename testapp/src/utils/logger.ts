export class Logger {
  info(message: string): void {
    console.log(`[info] ${message}`);
  }

  debug(message: string): void {
    console.log(`[debug] ${message}`);
  }
}
