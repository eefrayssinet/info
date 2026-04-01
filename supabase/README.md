# Prompt Golf Classroom + Supabase

## 1. Variables de entorno

La app lee:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

`/.env.local` ya esta preparado para desarrollo local y no se sube al repo.

## 2. Activar login anonimo

En Supabase Dashboard:

1. `Authentication`
2. `Providers`
3. activar `Anonymous Sign-Ins`

La app usa sesiones anonimas para que los estudiantes entren sin email ni password.

## 3. Crear las tablas

En Supabase Dashboard:

1. `SQL Editor`
2. crear una query nueva
3. pegar el contenido de `supabase/classroom_schema.sql`
4. ejecutar

## 4. Que crea el schema

- `classroom_sessions`
- `classroom_teams`
- `classroom_team_runs`
- `classroom_prompt_turns`
- indices
- triggers de `updated_at`
- RLS basico para usuarios autenticados
- alta de tablas en `supabase_realtime`

## 5. Rutas nuevas

- `/classroom`
- `/classroom/team`
- `/classroom/broadcast`

Si las tablas existen y las variables estan definidas, el Modo Aula usa Supabase.
Si no, cae al store local del navegador como respaldo.
