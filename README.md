# Processador de Planilhas Excel

## 📋 Descrição

Aplicativo web desenvolvido em React JS com Ant Design para processamento automatizado de planilhas Excel. O sistema permite:

- ✅ Upload de duas planilhas (antiga e atual)
- ✅ Remoção automática de números de processos duplicados
- ✅ Inserção de coluna "Responsável" 
- ✅ Comparação entre planilhas antiga e atual
- ✅ Adição de coluna "Pendente" baseada na comparação
- ✅ Visualização dos resultados em tabela interativa
- ✅ Download da planilha processada

## 🚀 Funcionalidades

### 1. Upload de Planilhas
- Suporte para arquivos .xlsx e .xls
- Interface drag-and-drop intuitiva
- Validação de arquivos

### 2. Processamento Automático
- **Remoção de Duplicatas**: Remove números de processos duplicados da planilha atual
- **Coluna Responsável**: Adiciona coluna vazia para preenchimento posterior
- **Comparação**: Compara números de processo entre planilha antiga e atual
- **Coluna Pendente**: Marca como "Sim" se o processo já existe na planilha antiga, "Não" se é novo

### 3. Interface Responsiva
- Design moderno com Ant Design
- Responsivo para desktop e mobile
- Indicadores visuais de progresso
- Estatísticas do processamento

## 🛠️ Tecnologias Utilizadas

- **React JS 19** - Framework frontend
- **Ant Design 5** - Biblioteca de componentes UI
- **XLSX** - Processamento de arquivos Excel
- **Vite** - Build tool e dev server
- **CSS3** - Estilos customizados

## 📦 Instalação e Execução

### Pré-requisitos
- Node.js 18+ 
- pnpm (gerenciador de pacotes)

### Passos para executar

1. **Clone ou baixe o projeto**
```bash
cd excel-processor
```

2. **Instale as dependências**
```bash
pnpm install
```

3. **Execute em modo desenvolvimento**
```bash
pnpm run dev
```

4. **Acesse no navegador**
```
http://localhost:5173
```

### Para produção

1. **Build da aplicação**
```bash
pnpm run build
```

2. **Preview da build**
```bash
pnpm run preview
```

## 📖 Como Usar

### Passo 1: Upload das Planilhas
1. Faça upload da **Planilha Antiga** (referência)
2. Faça upload da **Planilha Atual** (para processar)

### Passo 2: Processamento
1. Clique em "Processar Planilhas"
2. Aguarde o processamento automático

### Passo 3: Resultados
1. Visualize as estatísticas do processamento
2. Analise a tabela de resultados
3. Baixe a planilha processada em Excel

## 📊 Exemplo de Uso

### Planilha Antiga (Referência)
| Numero_Processo | Descricao   | Status      |
|----------------|-------------|-------------|
| 001/2024       | Processo A  | Concluído   |
| 002/2024       | Processo B  | Em andamento|

### Planilha Atual (Para Processar)
| Numero_Processo | Descricao   | Valor |
|----------------|-------------|-------|
| 001/2024       | Processo A  | 1000  |
| 003/2024       | Processo C  | 1500  |
| 001/2024       | Processo A  | 1000  | ← Duplicata

### Resultado Processado
| Numero_Processo | Descricao   | Valor | Responsável | Pendente |
|----------------|-------------|-------|-------------|----------|
| 001/2024       | Processo A  | 1000  |             | Sim      |
| 003/2024       | Processo C  | 1500  |             | Não      |

## 📁 Estrutura do Projeto

```
excel-processor/
├── public/                 # Arquivos públicos
├── src/
│   ├── components/         # Componentes React
│   ├── assets/            # Imagens e recursos
│   ├── App.jsx            # Componente principal
│   ├── App.css            # Estilos principais
│   └── main.jsx           # Ponto de entrada
├── package.json           # Dependências
└── vite.config.js         # Configuração do Vite
```

## 🔧 Customização

### Modificar Colunas de Processo
Para alterar a detecção automática da coluna de número de processo, edite a função `findProcessNumberColumn` em `App.jsx`:

```javascript
const findProcessNumberColumn = (data) => {
  // Adicione suas próprias palavras-chave aqui
  const possibleColumns = Object.keys(firstRow).filter(key => 
    key.toLowerCase().includes('processo') || 
    key.toLowerCase().includes('number') ||
    key.toLowerCase().includes('numero')
  );
  return possibleColumns[0] || Object.keys(firstRow)[0];
};
```

### Personalizar Interface
- Modifique `App.css` para alterar cores e estilos
- Ajuste componentes Ant Design conforme necessário
- Adicione novos campos ou funcionalidades

## 📝 Notas Importantes

- O sistema detecta automaticamente a coluna de número de processo
- Duplicatas são removidas baseadas no número do processo
- A coluna "Responsável" é adicionada vazia para preenchimento manual
- A coluna "Pendente" indica se o processo já existia na planilha antiga
- Suporte completo para arquivos Excel (.xlsx, .xls)

## 🐛 Solução de Problemas

### Erro ao ler arquivo Excel
- Verifique se o arquivo não está corrompido
- Certifique-se de que é um arquivo Excel válido (.xlsx ou .xls)

### Coluna de processo não encontrada
- Renomeie a coluna para incluir a palavra "processo" ou "numero"
- Ou modifique a função de detecção no código

### Interface não carrega
- Limpe o cache do navegador
- Verifique se todas as dependências foram instaladas

## 📄 Licença

Projeto desenvolvido para uso interno. Todos os direitos reservados.

---

**Desenvolvido com ❤️ usando React JS e Ant Design**

