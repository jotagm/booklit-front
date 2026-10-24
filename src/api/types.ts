// Tipos espelhando os records (DTOs) do backend Spring Boot (clube-livro).
// Mantidos em sincronia manualmente com adapter/in/rest/dto/**.

export type UUID = string;
// O id de usuário é um inteiro sequencial no backend (t_usuario.id);
// todo o resto continua UUID.
export type UsuarioId = number;
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
  id: UsuarioId;
  nome: string;
  email: string;
  bio?: string | null;
  createdAt: ISODateTime;
}

// ---- código por e-mail (OTP) — /auth/otp/email ----
/** Espelha `github.jotagm.auth.otp.Finalidade` (auth-core). */
export type FinalidadeOtp = "LOGIN" | "VERIFICAR_EMAIL" | "REDEFINIR_PIN";
export interface DesafioOtpResponse {
  desafioId: UUID;
  /** Instant em UTC (ex.: "2026-10-23T23:43:29.97Z"), não LocalDateTime. */
  expiraEm: string;
}
export interface OtpVerificadoResponse {
  email: string;
}

export interface PerfilRequest {
  nome: string;
  bio?: string | null;
}
export interface LivroDoPerfil {
  titulo: string;
  autor?: string | null;
  capaUrl?: string | null;
  paginaAtual?: number | null;
  totalPaginas?: number | null;
}
export interface ClubeEmComum {
  id: UUID;
  nome: string;
}
export interface PerfilResponse {
  id: UsuarioId;
  nome: string;
  bio?: string | null;
  membroDesde?: ISODateTime | null;
  ehVoce: boolean;
  ano: number;
  lidosNoAno: number;
  metaLivros?: number | null;
  totalLidos: number;
  lendoAgora: LivroDoPerfil[];
  ultimosLidos: LivroDoPerfil[];
  clubes: ClubeEmComum[];
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
  usuarioId: UsuarioId;
  clubeId: UUID;
  papel: ClubePapel;
}
export interface UsuarioClubeResponse {
  id: UUID;
  usuarioId: UsuarioId;
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
  // Link do Spotify (playlist, álbum, podcast ou audiobook). O backend normaliza e valida.
  spotifyUrl?: string | null;
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
  spotifyUrl: string | null;
}

// ---- registro de progresso ----
export interface RegistroRequest {
  valorAtual: number;
}
export interface RegistroResponse {
  id: UUID;
  leituraClubeId: UUID;
  livroTitulo: string;
  usuarioId: UsuarioId;
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
  sugeridoPorId: UsuarioId;
  livroGoogleId: string;
  livroTitulo: string;
  livroCapaUrl?: string | null;
}
export interface OpcaoVotoResponse {
  id: UUID;
  votacaoId: UUID;
  sugeridoPorId: UsuarioId;
  nomeSugeridoPor: string;
  livroGoogleId: string;
  livroTitulo: string;
  livroCapaUrl: string | null;
  // Quantos membros do clube têm este livro no "quero ler" da estante pessoal.
  membrosQueremLer: number;
}

export interface VotoRequest {
  votacaoId: UUID;
  opcaoVotoId: UUID;
  usuarioId: UsuarioId;
}
export interface VotoResponse {
  id: UUID;
  votacaoId: UUID;
  opcaoVotoId: UUID;
  livroTitulo: string;
  usuarioId: UsuarioId;
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
  usuarioId: UsuarioId;
  usuarioNome: string;
  conteudo: string;
  removido: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  respostas: ComentarioResponse[];
}

// ---- google books (proxy do backend) ----

// Onde o termo é procurado dentro do volume (enum CampoDeBusca no backend).
export type CampoDeBusca = "TUDO" | "TITULO" | "AUTOR" | "EDITORA" | "ISBN";

export interface VolumeInfo {
  title: string;
  subtitle?: string | null;
  authors?: string[] | null;
  publisher?: string | null;
  // Vem como "2017", "2017-05" ou "2017-05-31", dependendo do volume.
  publishedDate?: string | null;
  description?: string | null;
  pageCount?: number | null;
  language?: string | null;
  infoLink?: string | null;
  imageLinks?: { smallThumbnail?: string; thumbnail?: string } | null;
}

export interface GoogleBooksItem {
  id: string;
  volumeInfo: VolumeInfo;
}

export interface GoogleBooksResponse {
  totalItems?: number | null;
  // O Google omite "items" quando não há resultado, em vez de mandar lista vazia.
  items?: GoogleBooksItem[] | null;
}

// ---- erro padrão do GlobalExceptionHandler ----
export interface ErroResponse {
  status: number;
  mensagem: string;
  timestamp: ISODateTime;
}

// ---- convite por link ----
export interface ConviteLinkResponse {
  codigo: string;
  url: string;
}
export interface ConvitePreviewResponse {
  codigo: string;
  nomeClube: string;
  descricao: string | null;
  nomeLider: string | null;
  totalMembros: number;
  temas: string[];
  leituraAtual: { livroTitulo: string; livroCapaUrl: string | null } | null;
}

// ---- estante pessoal ----
export type StatusLeituraPessoal = "QUERO_LER" | "LENDO" | "LIDO" | "ABANDONADO";
export type ISODate = string; // LocalDate, ex: "2026-10-10"

export interface LeituraPessoalRequest {
  livroGoogleId: string;
  livroTitulo: string;
  livroAutor?: string | null;
  livroCapaUrl?: string | null;
  totalPaginas?: number | null;
  status?: StatusLeituraPessoal | null;
}
export interface LeituraPessoalResponse {
  id: UUID;
  livroGoogleId: string;
  livroTitulo: string;
  livroAutor: string | null;
  livroCapaUrl: string | null;
  status: StatusLeituraPessoal;
  totalPaginas: number | null;
  paginaAtual: number;
  percentual: number | null;
  nota: number | null;
  resenha: string | null;
  dataInicio: ISODate | null;
  dataFim: ISODate | null;
  clubeOrigemId: UUID | null;
  updatedAt: ISODateTime;
}
export interface EstanteResumoResponse {
  ano: number;
  metaLivros: number | null;
  lidosNoAno: number;
  lendo: number;
  queroLer: number;
}

// ---- feed e reações ----
export type TipoReacao = "CURTIR" | "FOGO" | "PALMAS";
export type TipoFeed =
  | "PROGRESSO"
  | "CONCLUIU"
  | "COMENTARIO"
  | "LEITURA_INICIADA"
  | "VOTACAO_ABERTA"
  | "VOTACAO_ENCERRADA"
  | "MEMBRO_ENTROU";
export interface FeedItemResponse {
  id: string;
  tipo: TipoFeed;
  clubeId: UUID;
  clubeNome: string;
  usuarioId?: UsuarioId | null;
  usuarioNome?: string | null;
  ehVoce: boolean;
  quando: ISODateTime;
  livroTitulo?: string | null;
  livroCapaUrl?: string | null;
  valorAtual?: number | null;
  valorMeta?: number | null;
  unidade?: string | null;
  texto?: string | null;
  leituraId?: UUID | null;
  reacoes: Partial<Record<TipoReacao, number>>;
  minhaReacao?: TipoReacao | null;
}
export interface ReacoesResponse {
  alvoId: string;
  reacoes: Partial<Record<TipoReacao, number>>;
  minhaReacao?: TipoReacao | null;
}
