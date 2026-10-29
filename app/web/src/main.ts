import './styles.css';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Elemento #app não encontrado');

root.innerHTML = `
  <div class="shell">
    <header class="nav"><a class="brand" href="/" aria-label="Amigo Secreto, página inicial"><span class="brand-icon" aria-hidden="true">🎁</span><span>Amigo Secreto</span></a><span class="pill">V1 · Em desenvolvimento</span></header>
    <main>
      <section class="hero" aria-labelledby="headline">
        <span class="eyebrow">✨ Sem cadastro, sem anúncios</span>
        <h1 id="headline">Uma surpresa <span class="grad">especial</span> começa aqui.</h1>
        <p>Organize seu amigo secreto com carinho, compartilhe um único link e descubra quem você tirou!</p>
        <div class="actions"><a class="button primary" href="/demo.html">🎉 Testar o protótipo V4</a><a class="button secondary" href="#sobre">Como vai funcionar</a></div>
      </section>
      <section id="sobre" class="panel" aria-label="Funcionalidades planejadas">
        <h2>Simples do começo ao presente 💜</h2>
        <div class="cards">
          <article class="card"><span class="emoji">👥</span><h3>Crie seu grupo</h3><p>Adicione de 3 a 50 participantes, sem pedir telefone ou e-mail.</p></article>
          <article class="card"><span class="emoji">💌</span><h3>Abra seu envelope</h3><p>Escolha seu nome e descubra seu amigo secreto com uma revelação especial.</p></article>
          <article class="card"><span class="emoji">💝</span><h3>Compartilhe desejos</h3><p>Escreva o que gostaria de ganhar e consulte as preferências do grupo.</p></article>
        </div>
        <p class="notice">Esta é a fundação do aplicativo. O botão de teste abre uma demonstração local; a API e o banco de dados ainda não estão integrados.</p>
      </section>
    </main>
    <footer class="site-footer"><p>Feito com 💜 por <strong>Antonio Martins</strong></p><p id="github-credit"></p><p>Gratuito, sem anúncios e sem cadastro. 🎁</p></footer>
  </div>`;


// Defina VITE_GITHUB_URL no .env quando o repositório estiver publicado.
const githubUrl = import.meta.env.VITE_GITHUB_URL?.trim();
const githubCredit = document.querySelector<HTMLParagraphElement>('#github-credit');
if (githubUrl && githubCredit) {
  try {
    const url = new URL(githubUrl);
    if (url.protocol === 'https:' && url.hostname === 'github.com' && url.pathname.split('/').filter(Boolean).length >= 2) {
      const link = document.createElement('a');
      link.href = url.toString();
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = '⌘ Código-fonte no GitHub ↗';
      githubCredit.append(link);
    }
  } catch { /* URL inválida: não mostrar o link. */ }
}