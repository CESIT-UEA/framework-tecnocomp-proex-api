const { where } = require("sequelize");
const { SaibaMais, Topico } = require("../models");
const { getUserByLtik } = require('../Services/userService');
const { verificaModuloAtivoByUser } = require("./moduloService");


async function getSaibaMais(ltik, id_topico){
    try {
        if (!ltik || !id_topico) throw new Error('Parâmetros obrigatórios ausentes!');

        const aluno = await getUserByLtik(ltik);
        const userModulo = await verificaModuloAtivoByUser(aluno);
        
        const topico = await Topico.findOne({
            where: {
                id: id_topico,
                id_modulo: userModulo.id_modulo
            }
        })

        if (!topico) {
            throw new Error('O tópico informado não pertence ao módulo ativo do usuário.');
        }

    
        const saibaMais = await SaibaMais.findAll({
            where: { id_topico },
            attributes: ['descricao', 'url']
        })

        if (!saibaMais) {
            throw new Error('Nenhum conteúdo "Saiba Mais" encontrado para este tópico.');
        }

        console.log(saibaMais)

        return saibaMais

    } catch (error) {
        throw new Error('Erro ao buscar saiba mais!')
    }
}

module.exports = { getSaibaMais }