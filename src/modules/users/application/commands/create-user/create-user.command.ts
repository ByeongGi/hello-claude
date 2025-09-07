import { Command, CommandProps } from '@/libs/ddd';

export class CreateUserCommand extends Command {
  readonly email: string;
  readonly name: string;
  readonly password?: string;

  constructor(props: CommandProps<CreateUserCommand>) {
    super(props);
    this.email = props.email;
    this.name = props.name;
    this.password = props.password;
  }
}
