import { from, of } from 'rxjs';
import { mergeMap, mergeScan, toArray } from 'rxjs/operators';
import { LanguageDetectionInput } from 'Server/inputs/languageDetectionInputs';
import { LanguageDetectionOutput } from 'Server/models/languageDetectionOutput';
import { detectLanguageMode } from 'Server/utils/languageDetectionUtils';
import { Arg, Query, Resolver } from 'type-graphql';
import { Service } from 'typedi';

@Service()
@Resolver(() => LanguageDetectionOutput)
export class LanguageDetectionResolver {
  @Query(() => [LanguageDetectionOutput])
  async detectFiletype(@Arg('data', () => [LanguageDetectionInput]) input: LanguageDetectionInput[]) {
    return of(...input)
      .pipe(
        mergeMap(async (input) => {
          const mode = await detectLanguageMode(input.filename, input.content);
          return { tabId: input.tabId, mode: mode || null };
        }),
        toArray(),
      )
      .toPromise();
  }
}
