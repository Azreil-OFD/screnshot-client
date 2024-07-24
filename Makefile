# Определение переменных
NODE_PATH := $(shell command -v node)
SERVER_BINARY = server

# Задача по умолчанию
default: install

pregenerate: copy_server remove_signature

# Копируем исполняемый файл node в server
copy_server:
	cp $(NODE_PATH) $(SERVER_BINARY)

# Удаляем подпись с серверного бинарного файла
remove_signature: copy_server
	codesign --remove-signature $(SERVER_BINARY)

# Задача для генерации бинарного файла
generate: sea_config postject_blob

# Запускаем экспериментальный node с указанной конфигурацией
sea_config:
	node --experimental-sea-config sea-config.json

# Используем npx postject для модификации бинарного файла
postject_blob:
	npx postject $(SERVER_BINARY) NODE_SEA_BLOB sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 --macho-segment-name NODE_SEA

install:
	npm i

build:
	npm run build

