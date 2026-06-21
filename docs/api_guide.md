# Guia da YGOPRODeck API (v7)

Este documento descreve as especificações, endpoints e boas práticas para integração com a YGOPRODeck API, conforme detalhado na documentação oficial da versão 7.

---

## ⚠️ Regras Cruciais e Limites

> [!IMPORTANT]
> **Rate Limiting (Limite de Requisições):**
> O limite máximo é de **20 requisições por segundo**. Se você exceder esse limite, seu IP será bloqueado temporariamente por 1 hora.
>
> **Política de Imagens:**
> **Não faça hotlink direto** das imagens a partir dos servidores da API em produção. Requisições repetidas em alta escala bloquearão seu IP. A recomendação oficial é baixar e armazenar (fazer cache/persistência) as imagens localmente.

### Cache do Servidor
As respostas da API para informações de cartas são cacheadas do lado do servidor por **2 dias (172.800 segundos)**, sendo limpas manualmente apenas quando novas cartas são inseridas no banco de dados global.

---

## 🛰️ Endpoints Principais

### 1. Obter Informações de Cartas (`cardinfo.php`)
Este é o endpoint principal para consultar e filtrar cartas no banco de dados.

* **URL:** `https://db.ygoprodeck.com/api/v7/cardinfo.php`
* **Método:** `GET`
* **Comportamento Padrão:** Chamar sem nenhum parâmetro retornará **todas as cartas** do banco de dados (use com cuidado para não estourar a banda do cliente).

#### Parâmetros de Filtro:

| Parâmetro | Tipo | Descrição | Exemplo |
| :--- | :--- | :--- | :--- |
| `name` | String | Nome exato da carta. Permite múltiplas cartas separadas por `\|`. | `Baby Dragon\|Time Wizard` |
| `fname` | String | Busca parcial/fuzzy pelo nome da carta. | `Magician` |
| `id` | String/Int | Código identificador (passcode) de 8 dígitos. Permite múltiplos separados por vírgula. | `6983839` |
| `konami_id` | String | O ID Konami oficial da carta (não confundir com o passcode). | |
| `type` | String | Filtra pelo tipo da carta (Main/Extra/Outros). Ver [Valores para type](#valores-para-type). | `Effect Monster` |
| `atk` | String | Filtra pelo valor de ATK. Suporta operadores. | `lt2500` (menor que 2500) |
| `def` | String | Filtra pelo valor de DEF. Suporta operadores. | `gte2000` (maior ou igual a 2000) |
| `level` | String | Filtra por Level ou Rank do monstro. Suporta operadores. | `lte8` (menor ou igual a 8) |
| `race` | String | Tipo oficial do monstro (ex: `Spellcaster`) ou tipo de Spell/Trap (ex: `Field`). | `Spellcaster` |
| `attribute` | String | Filtra pelo atributo do monstro. | `WIND`, `DARK`, `LIGHT` |
| `link` | Int | Filtra pelo valor de Link do monstro. | |
| `linkmarker`| String | Filtra pelas marcações de Link. Permite múltiplos valores separados por vírgula. | `top,bottom` |
| `scale` | Int | Filtra pelo valor da Escala de Pêndulo. | |
| `cardset` | String | Filtra pelo set/coleção em que a carta foi lançada. | `Metal Raiders` |
| `archetype` | String | Filtra pelo arquétipo da carta. | `Blue-Eyes`, `Dark Magician` |
| `banlist` | String | Filtra pelo status da carta na banlist informada (`tcg`, `ocg`, `goat`). | `tcg` |
| `sort` | String | Ordenação dos resultados (`atk`, `def`, `name`, `type`, `level`, `id`, `new`). | `atk` |
| `format` | String | Filtra pelo formato de jogo (`tcg`, `goat`, `ocg`, `master duel`, `rush duel`, etc). | `tcg` |
| `misc` | String | Passe `yes` para receber metadados adicionais (views, upvotes, etc.). | `yes` |
| `staple` | String | Passe `yes` para filtrar apenas cartas consideradas "staples". | `yes` |
| `has_effect`| Boolean | Filtra se a carta tem efeito ativo ou não (`true`/`false`). | `true` |
| `language` | String | Código do idioma para tradução dos textos (`fr`, `de`, `it`, `pt` para português). | `pt` |

#### Operadores para ATK, DEF e Level:
Você pode aplicar os seguintes prefixos nas consultas numéricas de `atk`, `def` e `level`:
* `lt` (less than) - Menor que
* `lte` (less than equals to) - Menor ou igual a
* `gt` (greater than) - Maior que
* `gte` (greater than equals to) - Maior ou igual a

---

### 2. Carta Aleatória (`randomcard.php`)
Retorna uma carta totalmente aleatória. Este endpoint **não aceita parâmetros** e desabilita cache do lado da API.
* **URL:** `https://db.ygoprodeck.com/api/v7/randomcard.php`

---

### 3. Listar Coleções/Sets (`cardsets.php`)
Retorna uma lista resumida de todas as coleções de cartas cadastradas no banco de dados.
* **URL:** `https://db.ygoprodeck.com/api/v7/cardsets.php`
* **Campos de Retorno:** `set_name`, `set_code`, `num_of_cards`, `tcg_date`.

---

### 4. Detalhes de um Set (`cardsetsinfo.php`)
Retorna as cartas e informações de preços de uma coleção específica com base no código do set.
* **URL:** `https://db.ygoprodeck.com/api/v7/cardsetsinfo.php`
* **Parâmetro Obrigatório:** `setcode` (ex: `SDY-046`)
* **Campos de Retorno:** `id`, `name`, `set_name`, `set_code`, `set_rarity`, `set_price` (em USD).

---

### 5. Todos os Arquétipos (`archetypes.php`)
Retorna a lista completa de todos os nomes de arquétipos disponíveis para filtro na base de dados.
* **URL:** `https://db.ygoprodeck.com/api/v7/archetypes.php`

---

### 6. Checar Versão do Banco (`checkDBVer.php`)
Verifica a versão atual e a última data em que o banco de dados principal de cartas foi atualizado. Muito útil para determinar se o cache local do app precisa ser atualizado.
* **URL:** `https://db.ygoprodeck.com/api/v7/checkDBVer.php`

---

## 💾 Estrutura do JSON de Resposta (Exemplo resumido)

A resposta padrão do `cardinfo.php` envelopa a lista de cartas dentro de um array `data`:

```json
{
  "data": [
    {
      "id": 6983839,
      "name": "Tornado Dragon",
      "type": "XYZ Monster",
      "frameType": "xyz",
      "desc": "2 Level 4 monsters\nOnce per turn...",
      "atk": 2100,
      "def": 2000,
      "level": 4,
      "race": "Wyrm",
      "attribute": "WIND",
      "card_sets": [
        {
          "set_name": "Duel Devastator",
          "set_code": "DUDE-EN019",
          "set_rarity": "Ultra Rare",
          "set_rarity_code": "(UR)",
          "set_price": "1.4"
        }
      ],
      "card_images": [
        {
          "id": 6983839,
          "image_url": "https://images.ygoprodeck.com/images/cards/6983839.jpg",
          "image_url_small": "https://images.ygoprodeck.com/images/cards_small/6983839.jpg",
          "image_url_cropped": "https://images.ygoprodeck.com/images/cards_cropped/6983839.jpg"
        }
      ],
      "card_prices": [
        {
          "cardmarket_price": "1.06",
          "tcgplayer_price": "1.4",
          "ebay_price": "2.50",
          "amazon_price": "3.10",
          "coolstuffinc_price": "1.50"
        }
      ]
    }
  ]
}
```

---

## 🎨 Tipos Válidos de Referência

### Valores para `type`:
* **Main Deck:** `"Effect Monster"`, `"Flip Effect Monster"`, `"Flip Tuner Effect Monster"`, `"Gemini Monster"`, `"Normal Monster"`, `"Normal Tuner Monster"`, `"Pendulum Effect Monster"`, `"Pendulum Normal Monster"`, `"Ritual Effect Monster"`, `"Ritual Monster"`, `"Spell Card"`, `"Trap Card"`, `"Tuner Monster"`, `"Union Effect Monster"`.
* **Extra Deck:** `"Fusion Monster"`, `"Link Monster"`, `"Synchro Monster"`, `"XYZ Monster"`, `"Pendulum Effect Fusion Monster"`, `"Synchro Pendulum Effect Monster"`, `"XYZ Pendulum Effect Monster"`.
* **Outros:** `"Skill Card"`, `"Token"`.

### Valores para `frameType`:
Usados para renderização visual do fundo da carta:
`normal`, `effect`, `ritual`, `fusion`, `synchro`, `xyz`, `link`, `normal_pendulum`, `effect_pendulum`, `ritual_pendulum`, `fusion_pendulum`, `synchro_pendulum`, `xyz_pendulum`, `spell`, `trap`, `token`, `skill`.
