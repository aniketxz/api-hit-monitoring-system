import MongoClientRepository from "../repository/ClientRepository.js";
import MongoApiRepository from "../repository/ApiKeyRepository.js";
import MongoUserRepository from "../../auth/repository/UserRepository.js";
import { ClientService } from "../services/clientService.js";
import { ClientController } from "../controller/clientController.js";
import authContainer from "../../auth/Dependencies/dependencies.js";

class Container {
  static init() {
    const repositories = {
      clientRepository: MongoClientRepository,
      apiKeyRepository: MongoApiRepository,
      userRepository: MongoUserRepository,
    };

    const services = {
      clientServices: new ClientService({
        clientRepository: repositories.clientRepository,
        apiKeyRepository: repositories.apiKeyRepository,
        userRepository: repositories.userRepository,
      }),
    };

    const controller = {
      clientController: new ClientController(
        services.clientServices,
        authContainer.services.authService,
      ),
    };

    return { repositories, services, controller };
  }
}

const initialized = Container.init();
export { Container };
export default initialized;
