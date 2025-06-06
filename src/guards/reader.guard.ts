import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RoleEnum } from 'src/types/enums/user.enum';
import { CustomRequest } from 'src/types/interfaces/user.interface';

@Injectable()
export class ReaderGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const user = context.switchToHttp().getRequest<CustomRequest>().user;
    if (
      user &&
      (user.role === RoleEnum.READER || user.role === RoleEnum.OWNER)
    ) {
      return true;
    }
    return false;
  }
}
