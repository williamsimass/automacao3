import React, { useState } from 'react';
import {
  Layout,
  Card,
  Upload,
  Button,
  Table,
  message,
  Space,
  Typography,
  Row,
  Col,
  Divider,
  Steps,
  Alert,
  Tag,
  Spin,
  Tooltip
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import responsibleMap from './responsibleMap';
import './App.css';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;
const { Step } = Steps;

function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [oldData, setOldData] = useState([]);
  const [newData, setNewData] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [oldFileName, setOldFileName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [stats, setStats] = useState({
    duplicatesRemoved: 0,
    responsibleAdded: 0,
    pendingAdded: 0
  });

  // Função para ler arquivo Excel
  const readExcelFile = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsBinaryString(file);
    });
  };

  // Upload da planilha antiga
  const handleOldFileUpload = async (file) => {
    setLoading(true);
    try {
      const data = await readExcelFile(file);
      setOldData(data);
      setOldFileName(file.name);
      message.success(`Planilha antiga carregada: ${file.name}`);
      if (newData.length > 0) {
        setCurrentStep(1);
      }
    } catch (error) {
      message.error('Erro ao ler a planilha antiga');
      console.error(error);
    }
    setLoading(false);
    return false; // Previne upload automático
  };

  // Upload da planilha atual
  const handleNewFileUpload = async (file) => {
    setLoading(true);
    try {
      const data = await readExcelFile(file);
      setNewData(data);
      setNewFileName(file.name);
      message.success(`Planilha atual carregada: ${file.name}`);
      if (oldData.length > 0) {
        setCurrentStep(1);
      }
    } catch (error) {
      message.error('Erro ao ler a planilha atual');
      console.error(error);
    }
    setLoading(false);
    return false; // Previne upload automático
  };

  // Função principal de processamento
  const processData = () => {
    if (oldData.length === 0 || newData.length === 0) {
      message.error('Por favor, carregue ambas as planilhas');
      return;
    }

    setLoading(true);
    setCurrentStep(2);

    try {
      // Identificar a coluna do número do processo
      const processNumberColumn = findProcessNumberColumn(newData);
      if (!processNumberColumn) {
        message.error('Coluna de número do processo não encontrada');
        setLoading(false);
        return;
      }

      // 1. Remover duplicatas da planilha atual
      const uniqueNewData = removeDuplicates(newData, processNumberColumn);
      
      // 2. Adicionar coluna "Responsável" (vazia inicialmente) - REMOVIDO
      // const dataWithResponsible = uniqueNewData.map(row => ({
      //   ...row,
      //   'Responsável': ''
      // }));

      // 3. Comparar com planilha antiga e adicionar coluna "Pendente"
      const dataWithPending = compareAndAddPending(uniqueNewData, oldData, processNumberColumn);

      // 4. Atribuir responsável com base na coluna 'Texto L=100'
      const finalData = assignResponsible(dataWithPending);

      setProcessedData(finalData);
      setStats({
        duplicatesRemoved: newData.length - uniqueNewData.length,
        responsibleAdded: finalData.length,
        pendingAdded: finalData.filter(row => row.Pendente === 'Sim').length
      });

      setCurrentStep(3);
      message.success('Processamento concluído com sucesso!');
    } catch (error) {
      message.error('Erro durante o processamento');
      console.error(error);
    }
    setLoading(false);
  };

  // Encontrar coluna do número do processo
  const findProcessNumberColumn = (data) => {
    if (data.length === 0) return null;
    const firstRow = data[0];
    const possibleColumns = Object.keys(firstRow).filter(key => 
      key.toLowerCase().includes('processo') || 
      key.toLowerCase().includes('number') ||
      key.toLowerCase().includes('numero')
    );
    return possibleColumns[0] || Object.keys(firstRow)[0];
  };

  // Remover duplicatas
  const removeDuplicates = (data, processColumn) => {
    const seen = new Set();
    return data.filter(row => {
      const processNumber = row[processColumn];
      if (seen.has(processNumber)) {
        return false;
      }
      seen.add(processNumber);
      return true;
    });
  };

  // Comparar e adicionar pendências
  const compareAndAddPending = (newData, oldData, processColumn) => {
    const oldProcessMap = new Map(oldData.map(row => [row[processColumn], row]));
    
    return newData.map(row => {
      const processNumber = row[processColumn];
      const oldRow = oldProcessMap.get(processNumber);
      const isPending = !!oldRow;
      
      return {
        ...row,
        'Pendente': isPending ? 'Sim' : 'Não',
        'Responsável': isPending && oldRow['Responsável'] ? oldRow['Responsável'] : (row['Responsável'] || '')
      };
    });
  };

  // Função auxiliar para normalizar texto (remover acentos e converter para minúsculas)
  const normalizeText = (text) => {
    if (typeof text !== 'string') return '';
    return text.normalize('NFD').replace(/[^\w\s]/gi, '').toLowerCase();
  };

  // Atribuir responsável com base no Texto L=100
  const assignResponsible = (data) => {
    return data.map(row => {
      if (row["Responsável"] && row["Responsável"] !== "") { // Se já tiver responsável (da planilha antiga), mantém
        return row;
      }

      const textL100 = row["Texto L=100"];
      if (textL100) {
        const normalizedTextL100 = normalizeText(textL100);

        for (const responsible in responsibleMap) {
          const keywords = responsibleMap[responsible];
          for (const keyword of keywords) {
            const normalizedKeyword = normalizeText(keyword);
            // Usar regex para correspondência de palavra completa (word boundary)
            const regex = new RegExp(`\\b${normalizedKeyword}\\b`, 'i');
            if (regex.test(normalizedTextL100)) {
              return { ...row, "Responsável": responsible };
            }
          }
        }
      }
       return row; // Retorna a linha sem alteração se nenhuma correspondência for encontrada
    });
  };
  const downloadProcessedFile = () => {
    if (processedData.length === 0) {
      message.error('Nenhum dado processado para download');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(processedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados Processados');
    
    const fileName = `planilha_processada_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    message.success('Arquivo baixado com sucesso!');
  };

  // Colunas da tabela de resultados
  const getTableColumns = () => {
    if (processedData.length === 0) return [];
    
    const firstRow = processedData[0];
    return Object.keys(firstRow).map(key => {
      if (key === 'Pendente') {
        return {
          title: key,
          dataIndex: key,
          key: key,
          fixed: 'right',
          render: (text) => (
            <Tag color={text === 'Sim' ? 'orange' : 'green'}>
              {text}
            </Tag>
          ),
          width: 120, // Largura fixa para a coluna Pendente
          ellipsis: true, // Adiciona ellipsis para truncar texto longo
        };
      }
      if (key === 'Responsável') {
        return {
          title: key,
          dataIndex: key,
          key: key,
          render: (text) => <Text type="secondary">{text || 'Não definido'}</Text>,
          width: 150, // Largura fixa para a coluna Responsável
          ellipsis: true, // Adiciona ellipsis para truncar texto longo
        };
      }
      // NOVO CÓDIGO PARA A COLUNA 'Texto L=100'
      if (key === 'Texto L=100') {
        return {
          title: key,
          dataIndex: key,
          key: key,
          render: (text) => { // 'text' é o valor da célula para esta coluna
            const maxLength = 51; // Defina o limite de caracteres visíveis
            // Verifica se 'text' é uma string antes de tentar truncar
            const truncatedText = typeof text === 'string' && text.length > maxLength 
                                  ? text.substring(0, maxLength) + '...' 
                                  : text;
            return (
              <Tooltip title={text}>
                <span>{truncatedText}</span>
              </Tooltip>
            );
          },
        };
      }
      
      return {
        title: key,
        dataIndex: key,
        key: key,
        ellipsis: true, // Adiciona ellipsis para truncar texto longo
        width: 200, // Largura padrão para outras colunas
      };
    });
  };

  const resetProcess = () => {
    setCurrentStep(0);
    setOldData([]);
    setNewData([]);
    setProcessedData([]);
    setOldFileName('');
    setNewFileName('');
    setStats({ duplicatesRemoved: 0, responsibleAdded: 0, pendingAdded: 0 });
  };

  return (
    <Layout className="min-h-screen">
      <Header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto">
          <Title level={3} className="!mb-0 !text-blue-600">
            <FileExcelOutlined className="mr-2" />
            Processador de Planilhas Excel
          </Title>
        </div>
      </Header>

      <Content className="p-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <Card className="mb-6">
            <Steps current={currentStep} className="mb-6">
              <Step title="Upload das Planilhas" icon={<UploadOutlined />} />
              <Step title="Processamento" icon={<SyncOutlined />} />
              <Step title="Resultados" icon={<CheckCircleOutlined />} />
            </Steps>
          </Card>

          {/* Etapa 1: Upload das Planilhas */}
          {currentStep === 0 && (
            <Row gutter={[24, 24]}>
              <Col xs={24} lg={12}>
                <Card 
                  title="📋 Planilha Antiga (Referência)"
                  className="h-full"
                  extra={oldData.length > 0 && <Tag color="green">Carregada</Tag>}
                >
                  <Upload.Dragger
                    accept=".xlsx,.xls"
                    beforeUpload={handleOldFileUpload}
                    showUploadList={false}
                    className="mb-4"
                  >
                    <p className="ant-upload-drag-icon">
                      <FileExcelOutlined />
                    </p>
                    <p className="ant-upload-text">
                      Clique ou arraste a planilha antiga aqui
                    </p>
                    <p className="ant-upload-hint">
                      Suporte para arquivos .xlsx e .xls
                    </p>
                  </Upload.Dragger>
                  {oldFileName && (
                    <Alert 
                      message={`Arquivo carregado: ${oldFileName}`}
                      type="success" 
                      showIcon 
                      className="mt-2"
                    />
                  )}
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card 
                  title="📊 Planilha Atual (Para Processar)"
                  className="h-full"
                  extra={newData.length > 0 && <Tag color="green">Carregada</Tag>}
                >
                  <Upload.Dragger
                    accept=".xlsx,.xls"
                    beforeUpload={handleNewFileUpload}
                    showUploadList={false}
                    className="mb-4"
                  >
                    <p className="ant-upload-drag-icon">
                      <FileExcelOutlined />
                    </p>
                    <p className="ant-upload-text">
                      Clique ou arraste a planilha atual aqui
                    </p>
                    <p className="ant-upload-hint">
                      Suporte para arquivos .xlsx e .xls
                    </p>
                  </Upload.Dragger>
                  {newFileName && (
                    <Alert 
                      message={`Arquivo carregado: ${newFileName}`}
                      type="success" 
                      showIcon 
                      className="mt-2"
                    />
                  )}
                </Card>
              </Col>
            </Row>
          )}

          {/* Botão de Processar */}
          {currentStep === 1 && (
            <Card className="text-center">
              <Title level={4}>Pronto para Processar!</Title>
              <Text className="block mb-4">
                Ambas as planilhas foram carregadas. O sistema irá:
              </Text>
              <ul className="text-left mb-6 max-w-md mx-auto">
                <li>✅ Remover números de processos duplicados</li>
                <li>✅ Adicionar coluna "Responsável"</li>
                <li>✅ Comparar com planilha antiga</li>
                <li>✅ Adicionar coluna "Pendente"</li>
              </ul>
              <Space>
                <Button 
                  type="primary" 
                  size="large" 
                  onClick={processData}
                  loading={loading}
                  icon={<SyncOutlined />}
                >
                  Processar Planilhas
                </Button>
                <Button onClick={resetProcess} icon={<DeleteOutlined />}>
                  Recomeçar
                </Button>
              </Space>
            </Card>
          )}

          {/* Etapa 3: Resultados */}
          {currentStep === 3 && (
            <div>
              <Row gutter={[16, 16]} className="mb-4">
                <Col xs={24} sm={8}>
                  <Card className="text-center">
                    <Title level={2} className="!text-red-500 !mb-2">
                      {stats.duplicatesRemoved}
                    </Title>
                    <Text>Duplicatas Removidas</Text>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card className="text-center">
                    <Title level={2} className="!text-blue-500 !mb-2">
                      {stats.responsibleAdded}
                    </Title>
                    <Text>Registros Processados</Text>
                  </Card>
                </Col>
                <Col xs={24} sm={8}>
                  <Card className="text-center">
                    <Title level={2} className="!text-orange-500 !mb-2">
                      {stats.pendingAdded}
                    </Title>
                    <Text>Marcados como Pendentes</Text>
                  </Card>
                </Col>
              </Row>

              <Card 
                title="📋 Dados Processados"
                extra={
                  <Space>
                    <Button 
                      type="primary" 
                      icon={<DownloadOutlined />}
                      onClick={downloadProcessedFile}
                    >
                      Baixar Excel
                    </Button>
                    <Button onClick={resetProcess} icon={<DeleteOutlined />}>
                      Nova Análise
                    </Button>
                  </Space>
                }
              >
                <Table
                  columns={getTableColumns()}
                  dataSource={processedData}
                  rowKey={(record, index) => index}
                  scroll={{ x: true, y: 600 }}
                  pagination={{ 
                    pageSize: 100,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50", "100", "250"],
                    showQuickJumper: true,
                    showTotal: (total) => `Total: ${total} registros`
                  }}
                />
              </Card>
            </div>
          )}

          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <Card className="text-center">
                <Spin size="large" />
                <Title level={4} className="mt-4">Processando...</Title>
                <Text>Aguarde enquanto processamos suas planilhas</Text>
              </Card>
            </div>
          )}
        </div>
      </Content>

      <Footer className="bg-gray-100 text-center py-4">
        <Text type="secondary">Desenvolvido por William Simas</Text>
      </Footer>
    </Layout>
  );
}

export default App;


