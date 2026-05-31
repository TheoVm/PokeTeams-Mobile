# Projeto-prova-primeiro-GQ Mobile

Aplicativo mobile em Expo SDK 54, Expo Router, Zustand e Supabase, criado como base mobile do projeto web `Projeto-prova-primeiro-GQ`.

## Executar

```bash
npm install
npx expo start
```

Para usar Expo Go, abra o QR Code exibido pelo Expo.

## Variaveis de ambiente

Crie um arquivo `.env` a partir de `.env.example`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon-publica
```

## EAS

Depois de autenticar na sua conta Expo:

```bash
eas login
eas build:configure --platform all
eas update:configure
eas update --auto
```

O arquivo `eas.json` ja foi criado com perfis `development`, `preview` e `production`.
