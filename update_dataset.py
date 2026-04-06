import csv
import locale
import sys

# Replace commas and convert to float without locale dependency to be safe
def clean_num(s):
    if not s: return "0"
    return s.replace('"', '').replace(',', '').strip()

def process():
    unificado = {}
    with open('Maiz_SIAP_ENA_Unificado.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row['Entidad']:
                unificado[row['Entidad'].strip()] = {
                    'Sembrada': clean_num(row['Sembrada (ha) [Oct18-Sep19]']),
                    'Cosechada': clean_num(row['Cosechada (ha) [Oct18-Sep19]']),
                    'Siniestrada': clean_num(row['Siniestrada (ha) [Oct18-Sep19]']),
                    'Produccion': clean_num(row['Produccion (ton) [Oct18-Sep19]']),
                    'Rendimiento': clean_num(row['Rendimiento (ton/ha)']),
                }
    
    # Read the original total
    rows_total = []
    fieldnames_total = []
    with open('Produccion_Total_Oct18_Sep19.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames_total = reader.fieldnames
        for row in reader:
            entidad = row.get('Entidad', '').strip()
            # Try matching by ignoring accents just in case? 
            # In Maiz_SIAP_ENA they use 'Michoacan', 'Mexico', 'Queretaro'
            # In Produccion_Total they use 'Michoacán', 'México', 'Querétaro'
            match_entidad = None
            if entidad in unificado:
                match_entidad = entidad
            else:
                # remove accents for checking
                ent_clean = entidad.replace('á', 'a').replace('é', 'e').replace('í', 'i').replace('ó', 'o').replace('ú', 'u')
                if ent_clean in unificado:
                    match_entidad = ent_clean
            
            if match_entidad:
                uni = unificado[match_entidad]
                row['Sembrada (ha) [Oct18-Sep19]'] = uni['Sembrada']
                row['Cosechada (ha) [Oct18-Sep19]'] = uni['Cosechada']
                row['Siniestrada (ha) [Oct18-Sep19]'] = uni['Siniestrada']
                # Notice Producción vs Produccion handling
                prod_key = 'Producción (ton) [Oct18-Sep19]' if 'Producción (ton) [Oct18-Sep19]' in row else 'Produccion (ton) [Oct18-Sep19]'
                if prod_key not in row:
                     # look for it
                     for k in row.keys():
                         if 'Producc' in k:
                             prod_key = k
                
                row[prod_key] = uni['Produccion']
                row['Rendimiento (ton/ha)'] = uni['Rendimiento']
            rows_total.append(row)
            
    # Write back
    with open('Produccion_Total_Oct18_Sep19.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames_total)
        writer.writeheader()
        writer.writerows(rows_total)
        
    print("Dataset updated successfully!")

if __name__ == '__main__':
    process()
