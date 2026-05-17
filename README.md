# Lume Reader — Sistema de leitura premium

Projeto React + Vite + Tailwind com visual escuro premium inspirado em estética chinesa moderna.

## O que foi finalizado

- Dashboard completo com tela inicial premium.
- Biblioteca com busca, filtros por PDF/EPUB/Favoritos e cards de livros.
- Favoritos e Recentes como seções próprias.
- Área de Anotações com criação de nova nota.
- Configurações com controle do menu lateral.
- Modal de importação de livros PDF/EPUB.
- Tela de leitura já integrada ao botão `Continuar leitura`.
- Menu lateral recolhível para o lado, com estado salvo no navegador.
- PWA básico com `manifest.webmanifest`, ícone e service worker.
- Build validado com `npm run build` e `npx tsc --noEmit`.

## Como rodar no desenvolvimento

```bash
npm install
npm run dev
```

## Como gerar a versão pronta

```bash
npm run build
```

A versão pronta fica na pasta `dist/`.

## Como abrir sem instalar nada no PC

Abra o arquivo:

```text
dist/index.html
```

Como os caminhos dos assets foram ajustados para relativos, as capas e artes funcionam dentro da pasta `dist/`.

## Observação

A importação de PDF/EPUB nesta versão cria o item na biblioteca visualmente. Para leitura real de PDF/EPUB, a próxima evolução recomendada é integrar `PDF.js`, `epub.js` e `IndexedDB`.
