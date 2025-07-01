import pandas as pd

# Criar planilha antiga (referência)
dados_antigos = {
    'Numero_Processo': ['001/2024', '002/2024', '003/2024', '004/2024', '005/2024'],
    'Descricao': ['Processo A', 'Processo B', 'Processo C', 'Processo D', 'Processo E'],
    'Status': ['Concluído', 'Em andamento', 'Pendente', 'Concluído', 'Em andamento'],
    'Responsável': ['João', 'Maria', 'Pedro', 'Ana', 'Carlos']
}

df_antigo = pd.DataFrame(dados_antigos)
df_antigo.to_excel('/home/ubuntu/excel-processor/planilha_antiga_exemplo.xlsx', index=False)

# Criar planilha atual (para processar)
dados_atuais = {
    'Numero_Processo': ['001/2024', '002/2024', '003/2024', '006/2024', '007/2024', '008/2024', '002/2024'],  # Note a duplicata
    'Descricao': ['Processo A', 'Processo B', 'Processo C', 'Processo F', 'Processo G', 'Processo H', 'Processo B Duplicado'],
    'Valor': [1000, 2000, 1500, 3000, 2500, 1800, 2000]
}

df_atual = pd.DataFrame(dados_atuais)
df_atual.to_excel('/home/ubuntu/excel-processor/planilha_atual_exemplo.xlsx', index=False)

print("Arquivos de exemplo criados com sucesso!")
print("- planilha_antiga_exemplo.xlsx")
print("- planilha_atual_exemplo.xlsx")

