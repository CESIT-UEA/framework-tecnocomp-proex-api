const {
  Topico,
  UsuarioTopico,
  Aluno
} = require("../models");

async function getUserTopico(id_modulo, id_aluno, ltik){
    try {
        if (!id_modulo || !id_aluno || !ltik) throw new Error(' Parâmetros obrigatórios ausentes!')
        const userTopico = await Topico.findAll({
              include: [
                {
                  model: UsuarioTopico,
                  required: true,
                  include: [
                    {
                      model: Aluno,
                      required: true,
                      where: {
                        id_aluno: id_aluno,
                        ltik: ltik
                      },
                    },
                  ],
                },
              ],
              where: {
                id_modulo: id_modulo,
              },
            });
        if (!userTopico) throw new Error('Erro ao buscar informações do usuários tópico pelo id do módulo');
        return userTopico
    } catch (error) {
        console.log('Erro ao buscar informações do usuários tópico pelo id do módulo', error)
    }
}

module.exports = {
    getUserTopico
}