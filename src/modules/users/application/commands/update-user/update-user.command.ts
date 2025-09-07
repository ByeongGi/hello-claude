import { Command, CommandProps } from '@/libs/ddd';

export class UpdateUserCommand extends Command {
  readonly id: string;
  readonly name?: string;
  readonly email?: string;
  readonly password?: string;

  constructor(props: CommandProps) {
    super(props);
    this.id = props.id;
    this.name = props.name;
    this.email = props.email;
    this.password = props.password;
  }
}
