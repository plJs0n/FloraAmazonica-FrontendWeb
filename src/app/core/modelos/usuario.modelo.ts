export interface Usuario {
  id: string;
  first_name: string;
  paternal_last_name: string;
  maternal_last_name: string | null;
  email: string;
  role: 'administrador' | 'registrador' | 'validador' | 'consultor';
  status: 'pendiente' | 'activo' | 'inactivo';
  avatar_url: string | null;
  institution: string | null;
  position: string | null;
}