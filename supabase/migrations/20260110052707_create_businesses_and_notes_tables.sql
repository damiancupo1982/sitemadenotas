/*
  # Sistema de Gestión de Notas por Negocio

  1. Nuevas Tablas
    - `businesses` (Negocios)
      - `id` (uuid, primary key)
      - `name` (text) - Nombre del negocio
      - `created_at` (timestamptz) - Fecha de creación
      - `user_id` (uuid) - ID del usuario propietario
    
    - `notes` (Notas)
      - `id` (uuid, primary key)
      - `business_id` (uuid, foreign key) - Referencia al negocio
      - `type` (text) - Tipo de nota: 'text', 'image', 'video'
      - `content` (text) - Contenido de texto transcrito o URL del archivo
      - `created_at` (timestamptz) - Fecha de creación
      - `user_id` (uuid) - ID del usuario propietario

  2. Seguridad
    - Habilitar RLS en ambas tablas
    - Políticas para que usuarios autenticados puedan:
      - Ver solo sus propios negocios y notas
      - Crear nuevos negocios y notas
      - Actualizar sus propios registros
      - Eliminar sus propias notas y negocios

  3. Datos Iniciales
    - Insertar los 4 negocios predeterminados (se agregarán después de crear las tablas)

  4. Índices
    - Índice en business_id para búsquedas rápidas de notas por negocio
    - Índice en user_id para ambas tablas
*/

-- Crear tabla de negocios
CREATE TABLE IF NOT EXISTS businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now()
);

-- Crear tabla de notas
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('text', 'image', 'video')),
  content text NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now()
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS notes_business_id_idx ON notes(business_id);
CREATE INDEX IF NOT EXISTS notes_user_id_idx ON notes(user_id);
CREATE INDEX IF NOT EXISTS businesses_user_id_idx ON businesses(user_id);

-- Habilitar RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Políticas para businesses
CREATE POLICY "Users can view own businesses"
  ON businesses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own businesses"
  ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own businesses"
  ON businesses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own businesses"
  ON businesses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Políticas para notes
CREATE POLICY "Users can view own notes"
  ON notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own notes"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
  ON notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);