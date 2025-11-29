import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

/**
 * Custom pipe to transform stringified JSON fields back into objects when
 * receiving a multipart/form-data request (i.e., when uploading a file).
 */
@Injectable()
export class FormDataJsonPipe implements PipeTransform {
  // Define which keys in the DTO should be parsed from a string to JSON.
  private readonly fieldsToParse: string[] = ['translations'];

  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'body' && value) {
      const transformedValue = { ...value };

      for (const key of this.fieldsToParse) {
        if (
          transformedValue[key] &&
          typeof transformedValue[key] === 'string'
        ) {
          try {
            // Attempt to parse the JSON string back into an object/array
            transformedValue[key] = JSON.parse(transformedValue[key]);
          } catch (e) {
            // If parsing fails, throw an error
            throw new BadRequestException(
              `Validation failed: Could not parse JSON for field: ${key}`,
            );
          }
        }
      }

      return transformedValue;
    }
    // Return original value if not body or no value exists
    return value;
  }
}
