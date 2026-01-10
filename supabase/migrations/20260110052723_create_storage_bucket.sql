/*
  # Configuración de Storage para Archivos Multimedia

  1. Bucket
    - Crear bucket 'business-files' para almacenar imágenes y videos
    - Configuración pública para facilitar acceso a archivos

  2. Seguridad
    - Políticas de storage para que usuarios autenticados puedan:
      - Subir archivos a sus propias carpetas
      - Ver sus propios archivos
      - Eliminar sus propios archivos
*/

-- Crear bucket para archivos de negocios
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-files', 'business-files', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir subir archivos
CREATE POLICY "Users can upload own files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'business-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política para ver archivos propios
CREATE POLICY "Users can view own files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'business-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Política para eliminar archivos propios
CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'business-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );