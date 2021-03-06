import expect from 'expect.js';

import {
  isEsIndexNotFoundError,
  createNoMatchingIndicesError,
  isNoMatchingIndicesError,
  convertEsIndexNotFoundError
} from '../../../../../src/server/index_patterns/service/lib/errors';

import {
  getIndexNotFoundError,
  getDocNotFoundError
} from './lib';

export default function ({ getService }) {
  const es = getService('es');
  const esArchiver = getService('esArchiver');

  describe('index_patterns/* error handler', () => {
    let indexNotFoundError;
    let docNotFoundError;
    before(async () => {
      await esArchiver.load('index_patterns/basic_index');
      indexNotFoundError = await getIndexNotFoundError(es);
      docNotFoundError = await getDocNotFoundError(es);
    });
    after(async () => {
      await esArchiver.unload('index_patterns/basic_index');
    });

    describe('isEsIndexNotFoundError()', () => {
      it('identifies index not found errors', () => {
        if (!isEsIndexNotFoundError(indexNotFoundError)) {
          throw new Error(`Expected isEsIndexNotFoundError(indexNotFoundError) to be true`);
        }
      });

      it('rejects doc not found errors', () => {
        if (isEsIndexNotFoundError(docNotFoundError)) {
          throw new Error(`Expected isEsIndexNotFoundError(docNotFoundError) to be true`);
        }
      });
    });

    describe('createNoMatchingIndicesError()', () => {
      it('returns a boom error', () => {
        const error = createNoMatchingIndicesError();
        if (!error || !error.isBoom) {
          throw new Error(`expected ${error} to be a Boom error`);
        }
      });

      it('sets output code to "no_matching_indices"', () => {
        const error = createNoMatchingIndicesError();
        expect(error.output.payload).to.have.property('code', 'no_matching_indices');
      });
    });

    describe('isNoMatchingIndicesError()', () => {
      it('returns true for errors from createNoMatchingIndicesError()', () => {
        if (!isNoMatchingIndicesError(createNoMatchingIndicesError())) {
          throw new Error('Expected isNoMatchingIndicesError(createNoMatchingIndicesError()) to be true');
        }
      });

      it('returns false for indexNotFoundError', () => {
        if (isNoMatchingIndicesError(indexNotFoundError)) {
          throw new Error('expected isNoMatchingIndicesError(indexNotFoundError) to be false');
        }
      });

      it('returns false for docNotFoundError', async () => {
        if (isNoMatchingIndicesError(docNotFoundError)) {
          throw new Error('expected isNoMatchingIndicesError(docNotFoundError) to be false');
        }
      });
    });

    describe('convertEsIndexNotFoundError()', () => {
      const indices = ['foo', 'bar'];

      it('converts indexNotFoundErrors into NoMatchingIndices errors', async () => {
        const converted = convertEsIndexNotFoundError(indices, indexNotFoundError);
        if (!isNoMatchingIndicesError(converted)) {
          throw new Error('expected convertEsIndexNotFoundError(indexNotFoundError) to return NoMatchingIndices error');
        }
      });

      it('returns other errors', async () => {
        const originals = [docNotFoundError, '', 1, /foo/, new Date(), new Error(), function () {}];

        originals.forEach(orig => {
          const converted = convertEsIndexNotFoundError(indices, orig);
          if (converted !== orig) {
            throw new Error(`expected convertEsIndexNotFoundError(${orig}) to return original error`);
          }
        });
      });
    });
  });
}
