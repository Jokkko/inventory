# Despliegue manual en EC2

## Paso 1: Crear instancia EC2
- Tipo de instancia: t2.micro
- Sistema operativo: Ubuntu 22.04 LTS
- Configurar grupo de seguridad: puerto 80 abierto

## Paso 2: Conectarse vía SSH
```bash
ssh -i "llave.pem" ubuntu@IP_DE_LA_INSTANCIA
```

## Paso 3: Instalar dependencias
```bash
sudo apt update
sudo apt install -y nodejs npm
```

## Paso 4: Clonar el proyecto
```bash
git clone https://github.com/Jokkko/inventory-deployment.git
cd inventory-deployment/application
npm install
```

## Paso 5: Ejecutar la aplicación
```bash
sudo node public/index.js
```
# Despliegue con AWS CLI

## Crear instancia EC2
```bash
aws ec2 run-instances   --image-id ami-0abcdef1234567890   --count 1   --instance-type t2.micro   --key-name llave   --security-group-ids sg-xxxxxxxx   --subnet-id subnet-xxxxxx   --user-data file://deployments/manual/user_data.sh
```

## Conectarse a la instancia
```bash
ssh -i "llave.pem" ubuntu@IP_DE_LA_INSTANCIA
```

## Comandos útiles dentro de la instancia
```bash
cd inventory-deployment/application
npm install
sudo node index.js
```
