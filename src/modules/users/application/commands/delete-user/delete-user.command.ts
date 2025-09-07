import { Command, CommandProps } from '@/libs/ddd';

export class DeleteUserCommand extends Command {
  readonly id: string;

  constructor(props: CommandProps) {
    super(props);
    this.id = props.id;
  }
}
