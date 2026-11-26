import { Link } from 'react-router-dom';
import { useI18n } from '../utils/i18n';

export function License() {
  const { t } = useI18n();

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 py-12 text-foreground sm:p-12">
      <section className="w-full max-w-3xl rounded-[2rem] border border-[var(--tema-border)] bg-[var(--tema-surface)] p-8 text-center shadow-2xl sm:p-12">
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{t('Licença do aplicativo')}</h1>
        <p className="mt-4 max-w-lg mx-auto text-sm leading-relaxed text-[var(--tema-text-secondary)]">
          {t('O Mango é distribuído sob a licença MIT. Abaixo está o texto completo da licença.')}
        </p>
        <div className="mt-6 overflow-y-auto max-h-[40vh] rounded-xl border border-[var(--tema-border)] bg-[var(--tema-input)] p-4 text-xs sm:text-sm leading-relaxed text-[var(--tema-text-primary)] text-left">{'MIT License'}

Copyright (c) 2026 Thiago Nebuloni

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.</div>
        <div className="mt-8">
          <Link to="/" className="inline-flex items-center gap-2 rounded-xl border border-[var(--tema-border)] px-4 py-2 text-sm font-semibold text-[var(--tema-text-primary)] transition hover:bg-white/[0.04]">
            {t('Voltar ao início')}
          </Link>
        </div>
      </section>
    </main>
  );
}

export default License;