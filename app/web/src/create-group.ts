import { groupApi } from './api';

export function setupCreateGroup(): void {
  const button = document.querySelector<HTMLAnchorElement>(
    'a[href="/demo.html"]'
  );

  if (!button) return;

  button.textContent = '🎉 Criar amigo secreto';
  button.href = '#criar-grupo';

  button.addEventListener('click', (event) => {
    event.preventDefault();

    const main = document.querySelector('main');
    if (!main) return;

    main.innerHTML = `
      <section class="panel" id="criar-grupo">
        <h2>Primeiro, seu grupo 💜</h2>
        <p>Organize seu amigo secreto em poucos passos.</p>

        <form id="create-group-form">
          <label class="field" for="group-name">Nome do grupo</label>
          <input id="group-name" type="text"
            value="Amigo Secreto da Família" maxlength="100" required>

          <label class="field" for="event-date">Data do encontro</label>
          <input id="event-date" type="date">

          <label class="field" for="gift-amount">
            Valor sugerido (R$)
          </label>
          <input id="gift-amount" type="number"
            min="0" max="1000000" step="0.01" placeholder="100,00">

          <label class="field" for="participants">
            Participantes (um por linha)
          </label>
          <textarea id="participants" rows="6" required
            placeholder="Ana&#10;Bruno&#10;Carol"></textarea>

          <p>Adicione de 3 a 50 participantes.</p>

          <div class="actions">
            <button class="button primary" type="submit">
              🎲 Criar e sortear
            </button>
          </div>

          <p id="create-feedback" role="status" aria-live="polite"></p>
        </form>
      </section>
    `;

    const form = document.querySelector<HTMLFormElement>(
      '#create-group-form'
    );

    form?.addEventListener('submit', async (event) => {
      event.preventDefault();

      const feedback = document.querySelector<HTMLElement>(
        '#create-feedback'
      );
      const submit = form.querySelector<HTMLButtonElement>(
        'button[type="submit"]'
      );

      if (!feedback || !submit) return;

      const name = (
        document.querySelector<HTMLInputElement>('#group-name')!
      ).value.trim();

      const eventDate = (
        document.querySelector<HTMLInputElement>('#event-date')!
      ).value;

      const amount = (
        document.querySelector<HTMLInputElement>('#gift-amount')!
      ).value;

      const names = (
        document.querySelector<HTMLTextAreaElement>('#participants')!
      ).value.split('\n').map(n => n.trim()).filter(Boolean);

      if (names.length < 3 || names.length > 50) {
        feedback.textContent = 'Informe de 3 a 50 participantes.';
        return;
      }

      submit.disabled = true;
      feedback.textContent = 'Criando grupo e realizando sorteio...';

      try {
        const created = await groupApi.create({
          name,
          ...(eventDate ? { eventDate } : {}),
          ...(amount ? {
            giftAmountCents: Math.round(Number(amount) * 100)
          } : {}),
          participants: names.map(name => ({ name }))
        });

        await groupApi.draw(created.groupId, created.adminToken);

        form.replaceChildren();

        const heading = document.createElement('h2');
        heading.textContent = '🎉 Sorteio realizado!';

        const description = document.createElement('p');
        description.textContent =
          `${names.length} participantes foram sorteados com sucesso.`;

        const detail = document.createElement('p');
        detail.textContent =
          'O grupo foi salvo no banco de dados. Na próxima etapa, ' +
          'vamos conectar o link compartilhável e os envelopes.';

        form.append(heading, description, detail);
      } catch (error) {
        feedback.textContent = error instanceof Error
          ? error.message
          : 'Não foi possível realizar o sorteio.';
      } finally {
        submit.disabled = false;
      }
    });
  });
}
