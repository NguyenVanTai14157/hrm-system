import tseslint from 'typescript-eslint';
export default tseslint.config({ ignores: ['dist/**', '.dev-dist/**', 'src/generated/**'] }, ...tseslint.configs.recommended,
  { files: ['test/*.cjs'], rules: { '@typescript-eslint/no-require-imports': 'off' } });
