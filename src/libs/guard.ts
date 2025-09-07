export class Guard {
  static againstNullOrUndefined(value: any, name: string): void {
    if (value === null || value === undefined) {
      throw new Error(`${name} cannot be null or undefined`);
    }
  }

  static againstInvalidEmail(email: string): void {
    // Basic email validation for now
    if (!email.includes('@')) {
      throw new Error('Invalid email format');
    }
  }
}
