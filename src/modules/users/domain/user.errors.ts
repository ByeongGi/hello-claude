export class UserAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`User with email ${email} already exists`);
    this.name = 'UserAlreadyExistsError';
  }
}

export class UserNotFoundError extends Error {
  constructor(userId?: string) {
    super(`User with ID ${userId || ''} not found`);
    this.name = 'UserNotFoundError';
  }
}
