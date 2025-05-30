import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { isUUID } from 'class-validator';

@ValidatorConstraint({ name: 'isValidReturns', async: false })
export class IsValidReturns implements ValidatorConstraintInterface {
  validate(value: string, args: ValidationArguments) {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) return false;
      if (parsed.length === 0) return false;
      return parsed.every((item: any) => {
        return (
          isUUID(item.item_id) && typeof item.qty === 'number' && item.qty > 0
        );
      });
    } catch (e) {
      return false;
    }
  }

  defaultMessage(args: ValidationArguments) {
    return 'Returns must be a valid JSON string containing an array of { item_id: UUID, qty: number }';
  }
}
