import type { TSESLint, TSESTree } from '@typescript-eslint/utils';
import { AST_NODE_TYPES, AST_TOKEN_TYPES } from '@typescript-eslint/utils';
import { getSourceCode } from '@typescript-eslint/utils/eslint-utils';

import { createRule } from '../util';

export default createRule({
  name: 'no-confusing-non-null-assertion',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow non-null assertion in locations that may be confusing',
      recommended: 'stylistic',
    },
    hasSuggestions: true,
    messages: {
      confusingEqual:
        'Confusing combinations of non-null assertion and equal test like "a! == b", which looks very similar to not equal "a !== b".',
      confusingAssign:
        'Confusing combinations of non-null assertion and equal test like "a! = b", which looks very similar to not equal "a != b".',
      notNeedInEqualTest: 'Unnecessary non-null assertion (!) in equal test.',
      notNeedInAssign:
        'Unnecessary non-null assertion (!) in assignment left hand.',
      wrapUpLeft:
        'Wrap up left hand to avoid putting non-null assertion "!" and "=" together.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = getSourceCode(context);
    return {
      'BinaryExpression, AssignmentExpression'(
        node: TSESTree.AssignmentExpression | TSESTree.BinaryExpression,
      ): void {
        function isLeftHandPrimaryExpression(
          node: TSESTree.Expression | TSESTree.PrivateIdentifier,
        ): boolean {
          return node.type === AST_NODE_TYPES.TSNonNullExpression;
        }

        if (
          node.operator === '==' ||
          node.operator === '===' ||
          node.operator === '='
        ) {
          const isAssign = node.operator === '=';
          const leftHandFinalToken = sourceCode.getLastToken(node.left);
          const tokenAfterLeft = sourceCode.getTokenAfter(node.left);
          if (
            leftHandFinalToken?.type === AST_TOKEN_TYPES.Punctuator &&
            leftHandFinalToken.value === '!' &&
            tokenAfterLeft?.value !== ')'
          ) {
            if (isLeftHandPrimaryExpression(node.left)) {
              context.report({
                node,
                messageId: isAssign ? 'confusingAssign' : 'confusingEqual',
                suggest: [
                  {
                    messageId: isAssign
                      ? 'notNeedInAssign'
                      : 'notNeedInEqualTest',
                    fix: (fixer): TSESLint.RuleFix[] => [
                      fixer.remove(leftHandFinalToken),
                    ],
                  },
                ],
              });
            } else {
              context.report({
                node,
                messageId: isAssign ? 'confusingAssign' : 'confusingEqual',
                suggest: [
                  {
                    messageId: 'wrapUpLeft',
                    fix: (fixer): TSESLint.RuleFix[] => [
                      fixer.insertTextBefore(node.left, '('),
                      fixer.insertTextAfter(node.left, ')'),
                    ],
                  },
                ],
              });
            }
          }
        }
      },
    };
  },
});
