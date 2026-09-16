// Tipos espelhando os records (DTOs) do backend Spring Boot (clube-livro).
// Mantidos em sincronia manualmente com adapter/in/rest/dto/**.

export type UUID = string;
export type ISODateTime = string; // LocalDateTime serializado pelo Jackson, ex: "2026-07-12T21:00:00"

// ---- enums ----
export type ClubePapel = "LIDER" | "MEMBRO";
export type ClubeStatus = "ATIVO" | "ENCERRADO";
export type ConviteStatus = "PENDENTE" | "ACEITO" | "RECUSADO" | "EXPIRADO";
export type TipoMeta = "PAGINA" | "CAPITULO";
export type VotacaoStatus = "ABERTA" | "ENCERRADA";

// ---- paginação (org.springframework.data.domain.Page) ----
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number; // página atual (0-based)
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ---- auth / usuario ----
export interface LoginRequest {
  email: string;
  senha: string;
}
export interface LoginResponse {
  token: string;
}
export interface UsuarioRequest {
  nome: string;
  email: string;
  senha: string;
}
export interface UsuarioResponse {
  id: UUID;
  nome: string;
  email: string;
  createdAt: ISODateTime;
}

// ---- tema ----
export interface TemaRequest {
  nome: string;
}
export interface TemaResponse {
  id: UUID;
  nome: string;
}

// ---- clube ----
export interface ClubeRequest {
  nome: string;
  descricao?: string | null;
  privado: boolean;
  temaIds?: UUID[] | null;
}
export interface ClubeResponse {
  id: UUID;
  nome: string;
  descricao: string | null;
  privado: boolean;
  status: ClubeStatus;
  createdAt: ISODateTime;
  temas: TemaResponse[];
}

// ---- usuario x clube (membros) ----
export interface UsuarioClubeRequest {
  usuarioId: UUID;
  clubeId: UUID;
  papel: ClubePapel;
}
export interface UsuarioClubeResponse {
  id: UUID;
  usuarioId: UUID;
  nomeUsuario: string;
  clubeId: UUID;
  nomeClube: string;
  papel: ClubePapel;
  entrouEm: ISODateTime;
}

// ---- convite ----
export interface ConviteRequest {
  clubeId: UUID;
  emailDestinatario: string;
  expiraEm: ISODateTime;
}
export interface ConviteResponse {
  id: UUID;
  clubeId: UUID;
  nomeClube: string;
  nomeConvidadoPor: string;
  emailDestinatario: string;
  status: ConviteStatus;
  expiraEm: ISODateTime;
  createdAt: ISODateTime;
}

// ---- leitura do clube ----
export interface LeituraClubeRequest {
  clubeId: UUID;
  livroGoogleId: string;
  livroTitulo: string;
  livroCapaUrl?: string | null;
  tipoMeta: TipoMeta;
  valorMeta: number;
  dataInicio: ISODateTime;
  dataFim: ISODateTime;
}
export interface LeituraClubeResponse {
  id: UUID;
  clubeId: UUID;
  nomeClube: string;
  livroGoogleId: string;
  livroTitulo: string;
  livroCapaUrl: string | null;
  tipoMeta: TipoMeta;
  valorMeta: number;
  dataInicio: ISODateTime;
  dataFim: ISODateTime;
}

// ---- registro de progresso ----
export interface RegistroRequest {
  valorAtual: number;
}
export interface RegistroResponse {
  id: UUID;
  leituraClubeId: UUID;
  livroTitulo: string;
  usuarioId: UUID;
  nomeUsuario: string;
  valorAtual: number;
  updatedAt: ISODateTime;
}

// ---- votação ----
export interface VotacaoRequest {
  clubeId: UUID;
  dataAbertura: ISODateTime;
  dataEncerramento: ISODateTime;
}
export interface VotacaoResponse {
  id: UUID;
  clubeId: UUID;
  nomeClube: string;
  status: VotacaoStatus;
  dataAbertura: ISODateTime;
  dataEncerramento: ISODateTime;
}

export interface OpcaoVotoRequest {
  votacaoId: UUID;
  sugeridoPorId: UUID;
  livroGoogleId: string;
  livroTitulo: string;
  livroCapaUrl?: string | null;
}
export interface OpcaoVotoResponse {
  id: UUID;
  votacaoId: UUID;
  sugeridoPorId: UUID;
  nomeSugeridoPor: string;
  livroGoogleId: string;
  livroTitulo: string;
  livroCapaUrl: string | null;
}

export interface VotoRequest {
  votacaoId: UUID;
  opcaoVotoId: UUID;
  usuarioId: UUID;
}
export interface VotoResponse {
  id: UUID;
  votacaoId: UUID;
  opcaoVotoId: UUID;
  livroTitulo: string;
  usuarioId: UUID;
  nomeUsuario: string;
  peso: number;
}

// ---- comentários ----
export interface ComentarioRequest {
  comentarioPaiId?: UUID | null;
  conteudo: string;
}
export interface ComentarioAtualizarRequest {
  conteudo: string;
}
export interface ComentarioResponse {
  id: UUID;
  leituraClubeId: UUID;
  usuarioId: UUID;
  usuarioNome: string;
  conteudo: string;
  removido: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  respostas: ComentarioResponse[];
}

// ---- google books (proxy do backend) ----
export interface GoogleBooksResponse {
  items: {
    id: string;
    volumeInfo: {
      title: string;
      authors?: string[];
      imageLinks?: { thumbnail?: string };
    };
  }[];
}

// ---- erro padrão do GlobalExceptionHandler ----
export interface ErroResponse {
  status: number;
  mensagem: string;
  timestamp: ISODateTime;
}
