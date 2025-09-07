import { Command, CommandProps } from '@/libs/ddd';

export class DeleteUserCommand extends Command {
  readonly id: string;

  constructor(props: CommandProps<DeleteUserCommand>) {
    super(props);
    this.id = props.id;
  }
}
