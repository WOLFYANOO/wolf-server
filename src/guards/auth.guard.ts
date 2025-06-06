import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { CustomRequest } from 'src/types/interfaces/user.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // const user = context.switchToHttp().getRequest<CustomRequest>().user;
    // if (user) {
    //   return true;
    // }
    // return false;
    return true;
  }
}
