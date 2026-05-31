-- O bucket correction-attachments foi criado inicialmente como público.
-- Screenshots de erro podem conter dados de paciente (PHI/LGPD), então o
-- acesso passa a ser por URLs assinadas de curta duração. Tornamos o bucket
-- privado; as policies de RLS (membro da clínica) seguem controlando upload,
-- leitura (para o RETURNING do upload e geração de signed URLs) e exclusão.
update storage.buckets set public = false where id = 'correction-attachments';
