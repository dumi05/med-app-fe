# med-app-fe

Frontend di **Studio Medico "La Mole"**: Single Page Application in **Angular 20** con **Bootstrap 5** e TypeScript. Si collega alle API REST del backend `med-app-be` e offre tre aree separate, una per **paziente**, **medico** e **amministratore**, più una pagina pubblica per il familiare delegato ad accedere a un referto.

Fa parte di un progetto in tre repository:

| Repository | Contenuto |
|---|---|
| [med-app-be](https://github.com/dumi05/med-app-be) | Backend, API REST |
| `med-app-fe` (questo) | Frontend Angular |
| [med-app-infra](https://github.com/dumi05/med-app-infra) | Docker Compose per avviare tutto insieme |

## Cosa c'è nel progetto

Il codice è in `src/app/`:

| Cartella | Contenuto |
|---|---|
| `patient/` | Area del paziente: ricerca delle disponibilità, appuntamenti, referti e fatture, dati personali e privacy, deleghe dei referti |
| `doctor/` | Area del medico: elenco delle visite, agenda, deleghe tra medici, avvisi ai pazienti |
| `admin/` | Area dell'amministratore: dashboard, medici, pazienti, specializzazioni, listino prezzi, agenda |
| `public/` | Pagina pubblica per accedere a un referto con link e codice di delega |
| `shared/` | Parti condivise: autenticazione (servizio, guard, intercettori), layout, calendario, componenti e servizi comuni verso le API |

Le rotte sono caricate in modo differito per ruolo e protette da guard che controllano l'autenticazione e il ruolo dell'utente. Le chiamate al backend usano il percorso relativo `/api/v1`, quindi il frontend funziona senza modifiche sia in sviluppo sia dietro nginx.

## Come avviarlo

### Con Docker Compose (consigliato): tutta l'applicazione

L'avvio completo, con database e backend, si fa dal repository `med-app-infra`:

```bash
docker compose up --build
```

L'applicazione è poi su **http://localhost:8081**. Vedi il README di `med-app-infra` per i prerequisiti e per la struttura delle cartelle (i tre repository devono essere cartelle sorelle).

### In sviluppo, con il server di Angular

Prerequisiti: **Node.js 22** (la stessa versione del `Dockerfile` e della CI) e un backend in esecuzione su `http://localhost:8080` (vedi il README di `med-app-be`).

```bash
npm ci
npm start
```

Apri **http://localhost:4200**. Le richieste a `/api` vengono inoltrate a `localhost:8080` dal proxy di sviluppo (`proxy.conf.json`) e il server ricarica la pagina a ogni modifica.

### Con Docker, solo il frontend

Il `Dockerfile` compila l'applicazione in produzione e la serve con nginx sulla porta 80 del container.

```bash
docker build -t med-app-fe .
```

La configurazione di nginx (`nginx.conf`) inoltra `/api/` all'host **`backend`** sulla porta 8080. Per questo il container del frontend **da solo non parte**: nginx deve poter risolvere il nome `backend`. Per avviarlo senza `med-app-infra` serve una rete Docker in cui esista un container chiamato `backend`:

```bash
docker run --rm -p 8081:80 --network <rete-con-il-backend> med-app-fe
```

Nella pratica è più semplice usare `med-app-infra`.

## Lanciare tutto insieme: serve per forza `med-app-infra`?

No, ma è il modo più semplice, perché collega già database, backend e frontend. Le alternative sono il solo sviluppo locale (database, backend con `./mvnw spring-boot:run`, frontend con `npm start`) oppure container avviati a mano su una rete comune con un servizio chiamato `backend`.

## Test e build

```bash
npm test                  # unit test con Karma e Jasmine (richiede Chrome)
npm run build             # build; usa -- --configuration production per quella di produzione
```

Come fa la CI, senza interfaccia: `npx ng test --watch=false --browsers=ChromeHeadless`. Su ogni push e pull request verso `main`, GitHub Actions esegue i test, la build e la costruzione dell'immagine Docker.

Il progetto non include test end-to-end automatici: le prove sull'intero percorso dei tre ruoli sono state eseguite a mano.

## Comandi Angular CLI utili

```bash
ng generate component nome-componente    # genera un nuovo componente
ng generate --help                        # elenco degli schematics disponibili
```

Documentazione: https://angular.dev/tools/cli
