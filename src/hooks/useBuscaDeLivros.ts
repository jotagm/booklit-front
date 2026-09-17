import { useCallback, useState } from "react";
import { buscarLivrosGoogle } from "../api/leituras";
import { extrairMensagemErro } from "../api/client";
import type { CampoDeBusca, GoogleBooksItem } from "../api/types";

const TAMANHO_PAGINA = 12;

export const CAMPOS: { valor: CampoDeBusca; rotulo: string }[] = [
  { valor: "TUDO", rotulo: "tudo" },
  { valor: "TITULO", rotulo: "título" },
  { valor: "AUTOR", rotulo: "autor" },
  { valor: "ISBN", rotulo: "ISBN" },
];

// Estado compartilhado pela busca do seletor de livros e pela tela de explorar livros:
// termo, campo, filtro de idioma, paginação e os erros da chamada.
export function useBuscaDeLivros() {
  const [termo, setTermo] = useState("");
  const [campo, setCampoInterno] = useState<CampoDeBusca>("TUDO");
  // Português por padrão: sem o filtro, "Duna" devolve as edições em inglês e a
  // brasileira não aparece entre os primeiros resultados.
  const [soEmPortugues, setSoEmPortugues] = useState(true);

  const [resultados, setResultados] = useState<GoogleBooksItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [buscou, setBuscou] = useState(false);

  const executar = useCallback(
    async (opcoes: { campo?: CampoDeBusca; emPortugues?: boolean; pagina?: number } = {}) => {
      const termoLimpo = termo.trim();
      if (!termoLimpo) return;

      const campoUsado = opcoes.campo ?? campo;
      const emPortugues = opcoes.emPortugues ?? soEmPortugues;
      const paginaUsada = opcoes.pagina ?? 0;

      setCarregando(true);
      setErro(null);
      try {
        const resposta = await buscarLivrosGoogle(termoLimpo, {
          campo: campoUsado,
          idioma: emPortugues ? "pt" : undefined,
          page: paginaUsada,
          size: TAMANHO_PAGINA,
        });

        // O Google omite "items" quando não há resultado, em vez de mandar lista vazia.
        const itens = resposta.items ?? [];
        // Página 0 substitui; as seguintes acumulam, porque é um "carregar mais".
        setResultados((anteriores) => (paginaUsada === 0 ? itens : [...anteriores, ...itens]));
        setTotal(resposta.totalItems ?? 0);
        setPagina(paginaUsada);
        setBuscou(true);
      } catch (e) {
        setErro(extrairMensagemErro(e, "Não foi possível buscar livros agora."));
      } finally {
        setCarregando(false);
      }
    },
    [termo, campo, soEmPortugues]
  );

  // Trocar de campo ou de idioma refaz a busca na hora: manter a lista antiga na tela
  // faria os resultados contradizerem o filtro selecionado.
  const setCampo = useCallback(
    (novo: CampoDeBusca) => {
      setCampoInterno(novo);
      if (buscou) executar({ campo: novo });
    },
    [buscou, executar]
  );

  const alternarIdioma = useCallback(() => {
    const novo = !soEmPortugues;
    setSoEmPortugues(novo);
    if (buscou) executar({ emPortugues: novo });
  }, [soEmPortugues, buscou, executar]);

  const temMais = resultados.length > 0 && resultados.length < total;

  return {
    termo,
    setTermo,
    campo,
    setCampo,
    soEmPortugues,
    alternarIdioma,
    resultados,
    total,
    carregando,
    erro,
    buscou,
    temMais,
    buscar: () => executar({ pagina: 0 }),
    carregarMais: () => executar({ pagina: pagina + 1 }),
  };
}
