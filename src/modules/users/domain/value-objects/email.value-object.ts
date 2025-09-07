import { ValueObject } from '@/libs/ddd';
import { Guard } from '@/libs/guard/guard';

interface EmailProps {
  value: string;
}

export class Email extends ValueObject<EmailProps> {
  static create(email: string): Email {
    Guard.againstNullOrUndefined(email, 'email');
    Guard.againstInvalidEmail(email);

    return new Email({ value: email.toLowerCase().trim() });
  }

  get value(): string {
    return this.props.value;
  }

  get isVerified(): boolean {
    // 이메일 검증 로직
    return true; // 구현 필요
  }

  protected validate(props: EmailProps): void {
    if (!props.value.includes('@')) {
      throw new Error('Invalid email format');
    }
  }
}
