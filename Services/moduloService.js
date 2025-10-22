const { getUserByLtik } = require("./userService");
const {
  UsuarioModulo,
  Modulo
} = require("../models");

async function getInfoModuloWithUser(ltik){
    try {
        const user = await getUserByLtik(ltik)
    
        const userModulo = await verificaModuloAtivoByUser(user);

        const modulo = await getModuloById(userModulo.id_modulo)

        const dados_modulo = {
            user: user.dataValues,
            modulo: modulo.dataValues,
            userModulo: userModulo.dataValues
        }
        console.log("passou aqui", dados_modulo)
        return dados_modulo
    } catch (err) {
        console.error("Erro ao buscar informações do módulo com usuário", err.message);
        throw err; 
    }

}

async function getModuloById(id){
    try {
        if (!id) throw new Error('Id é obrigatório para buscar módulo!');
        const modulo = await Modulo.findByPk(id);

        if (!modulo) throw new Error('Módulo não encontrado!');
        
        return modulo
    } catch (err) {
        console.error("Erro ao buscar módulo por id", err.message);
        throw err; 
    }
}

async function verificaModuloAtivoByUser(user){
    try {
        if (!user || !user.id_aluno) {
            throw new Error("Usuário inválido ou id_aluno ausente");
        }

        const userModulo = await UsuarioModulo.findOne({
          where: { id_aluno: user.id_aluno, ativo: true },
        });
        if (!userModulo) throw new Error("Módulo ativo não encontrado");

        return userModulo;
    } catch (err) {
       console.error("Erro ao verificar modulo ativo por usuário", err.message);
        throw err; 
    }
}

module.exports = {
    getInfoModuloWithUser,
    getModuloById,
    verificaModuloAtivoByUser
}