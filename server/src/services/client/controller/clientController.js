import ResponseFormatter from '../../../shared/utils/responseFormatter.js';

export class ClientController {
	constructor(clientService, authService) {
		if (!clientService) {
			throw new Error('ClientService is required');
		}

		if (!authService) {
			throw new Error('AuthService is required');
		}

		this.clientService = clientService;
		this.authService = authService;
	}

	async createClient(req, res, next) {
		try {
			const isSuperAdmin = await this.authService.checkSuperAdminPermissions(req.user.userId);

			if (!isSuperAdmin) {
				return res.status(403).json(ResponseFormatter.error('Access denied', 403));
			}

			const client = await this.clientService.createClient(req.body, req.user);

			return res
				.status(201)
				.json(ResponseFormatter.success(client, 'Client created successfully', 201));
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Create new user for given client
	 * @param {Request} req
	 * @param {Response} res
	 * @param {*} next
	 */
	async createClientUser(req, res, next) {
		try {
			const { clientId } = req.params;
			const user = await this.clientService.createClientUser(clientId, req.body, req.user);
			return res
				.status(201)
				.json(ResponseFormatter.success(user, 'Client user created successfully', 201));
		} catch (error) {
			next(error);
		}
	}

	/**
	 * Create new user for given client
	 * @param {Request} req
	 * @param {Response} res
	 * @param {*} next
	 */
	async createApiKey(req, res, next) {
		try {
			const { clientId } = req.params;
			const apiKey = await this.clientService.createApiKey(clientId, req.body, req.user);

			return res
				.status(201)
				.json(ResponseFormatter.success(apiKey, 'API key created successfully', 201));
		} catch (error) {
			next(error);
		}
	}

	/**
	 *
	 * @param {Request} req
	 * @param {Response} res
	 * @param {*} next
	 * @returns {Object}
	 */
	async getClientApiKeys(req, res, next) {
		try {
			const { clientId } = req.params;
			const apiKey = await this.clientService.getClientApiKeys(clientId, req.user);
			return res
				.status(200)
				.json(ResponseFormatter.success(apiKey, 'API keys fetched successfully', 200));
		} catch (error) {
			next(error);
		}
	}
}
