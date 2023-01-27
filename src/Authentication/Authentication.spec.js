import { Types } from '../Core/Types'
import { AppTestHarness } from '../TestTools/AppTestHarness'
import { Router } from '../Routing/Router'
import { RouterRepository } from '../Routing/RouterRepository'
import { LoginRegisterPresenter } from './LoginRegisterPresenter'
import { GetSuccessfulRegistrationStub } from '../TestTools/GetSuccessfulRegistrationStub'
import { GetFailedRegistrationStub } from '../TestTools/GetFailedRegistrationStub'

import { GetSuccessfulUserLoginStub } from '../TestTools/GetSuccessfulUserLoginStub'
import { GetFailedUserLoginStub } from '../TestTools/GetFailedUserLoginStub'

import { UserModel } from './UserModel'

let appTestHarness = null
let router = null
let routerRepository = null
let routerGateway = null
let onRouteChange = null
let dataGateway = null
let userModel = null
let loginRegisterPresenter = null

describe('init', () => {
  beforeEach(() => {
    appTestHarness = new AppTestHarness()
    appTestHarness.init()
    router = appTestHarness.container.get(Router)
    routerRepository = appTestHarness.container.get(RouterRepository)
    routerGateway = appTestHarness.container.get(Types.IRouterGateway)
    dataGateway = appTestHarness.container.get(Types.IDataGateway)
    userModel = appTestHarness.container.get(UserModel)
    loginRegisterPresenter = appTestHarness.container.get(LoginRegisterPresenter)
    onRouteChange = () => {}
  })

  it('should be an null route', () => {
    expect(routerRepository.currentRoute.routeId).toBe(null)
  })

  describe('bootstrap', () => {
    beforeEach(() => {
      appTestHarness.bootStrap(onRouteChange)
    })

    it('should start at null route', () => {
      expect(routerRepository.currentRoute.routeId).toBe(null)
    })

    describe('routing', () => {
      it('should block wildcard *(default) routes when not logged in', () => {
        router.goToId('default')

        expect(routerGateway.goToId).toHaveBeenLastCalledWith('loginLink')
      })

      it('should block secure routes when not logged in', () => {
        router.goToId('homeLink')

        expect(routerGateway.goToId).toHaveBeenLastCalledWith('loginLink')
      })

      it('should allow public route when not logged in', () => {
        router.goToId('authorPolicyLink')

        expect(routerGateway.goToId).toHaveBeenLastCalledWith('authorPolicyLink')
      })
    })

    describe('register', () => {
      it('should show successful user message on successful register', async () => {
        dataGateway.post = jest.fn().mockImplementation((path) => {
          return Promise.resolve(GetSuccessfulRegistrationStub())
        })

        expect(loginRegisterPresenter.showValidationWarning).toBe(false)
        expect(loginRegisterPresenter.messages).toEqual([])

        loginRegisterPresenter.email = 'a@b.com'
        loginRegisterPresenter.password = '12'
        await loginRegisterPresenter.register()

        expect(dataGateway.post).toHaveBeenLastCalledWith('/register', { email: 'a@b.com', password: '12' })

        expect(loginRegisterPresenter.showValidationWarning).toBe(false)
        expect(loginRegisterPresenter.messages).toEqual(['User registered'])
      })

      it('should show failed server message on failed register', async () => {
        dataGateway.post = jest.fn().mockImplementation((path) => {
          return Promise.resolve(GetFailedRegistrationStub())
        })

        expect(loginRegisterPresenter.showValidationWarning).toBe(false)
        expect(loginRegisterPresenter.messages).toEqual([])

        loginRegisterPresenter.email = 'a@b.com'
        loginRegisterPresenter.password = '123'
        await loginRegisterPresenter.register()

        expect(dataGateway.post).toHaveBeenLastCalledWith('/register', { email: 'a@b.com', password: '123' })

        expect(loginRegisterPresenter.showValidationWarning).toBe(true)
        expect(loginRegisterPresenter.messages).toEqual([
          'Failed: credentials not valid must be (email and >3 chars on password).'
        ])
      })
    })

    describe('login', () => {
      it('should start at loginLink', () => {
        router.goToId('default')
        expect(routerGateway.goToId).toHaveBeenLastCalledWith('loginLink')
        expect(routerRepository.currentRoute.routeId).toBe('loginLink')
      })

      it('should go to homeLink on successful login (and populate userModel)', async () => {
        dataGateway.post = jest.fn().mockImplementation((path) => {
          return Promise.resolve(GetSuccessfulUserLoginStub())
        })

        router.goToId('loginLink')
        expect(routerGateway.goToId).toHaveBeenLastCalledWith('loginLink')
        expect(routerRepository.currentRoute.routeId).toBe('loginLink')

        expect(userModel.email).toBe(null)
        expect(userModel.token).toBe(null)

        expect(loginRegisterPresenter.showValidationWarning).toBe(false)
        expect(loginRegisterPresenter.messages).toEqual([])

        loginRegisterPresenter.email = 'a@b.com'
        loginRegisterPresenter.password = '123'
        await loginRegisterPresenter.login()

        expect(dataGateway.post).toHaveBeenLastCalledWith('/login', { email: 'a@b.com', password: '123' })

        expect(routerGateway.goToId).toHaveBeenLastCalledWith('homeLink')

        expect(userModel.email).toBe('a@b.com')
        expect(userModel.token).toBe('a@b1234.com')

        // resetted after route change
        expect(loginRegisterPresenter.showValidationWarning).toBe(false)
        expect(loginRegisterPresenter.messages).toEqual([])
      })

      it('should update private route when successful login', async () => {
        dataGateway.post = jest.fn().mockImplementation((path) => {
          return Promise.resolve(GetSuccessfulUserLoginStub())
        })

        router.goToId('loginLink')
        expect(routerGateway.goToId).toHaveBeenLastCalledWith('loginLink')
        expect(routerRepository.currentRoute.routeId).toBe('loginLink')

        loginRegisterPresenter.email = 'a@b.com'
        loginRegisterPresenter.password = '123'
        await loginRegisterPresenter.login()

        expect(routerRepository.currentRoute.routeId).toBe('homeLink')
        expect(routerRepository.currentRoute.routeDef.isSecure).toBe(true)
      })

      it('should not update route when failed login', async () => {
        dataGateway.post = jest.fn().mockImplementation((path) => {
          return Promise.resolve(GetFailedUserLoginStub())
        })

        router.goToId('loginLink')
        expect(routerGateway.goToId).toHaveBeenLastCalledWith('loginLink')

        expect(userModel.email).toBe(null)
        expect(userModel.token).toBe(null)

        expect(loginRegisterPresenter.showValidationWarning).toBe(false)
        expect(loginRegisterPresenter.messages).toEqual([])

        loginRegisterPresenter.email = 'a@b.com'
        loginRegisterPresenter.password = '123'
        await loginRegisterPresenter.login()

        expect(dataGateway.post).toHaveBeenLastCalledWith('/login', { email: 'a@b.com', password: '123' })

        expect(routerGateway.goToId).toHaveBeenLastCalledWith('loginLink')

        expect(userModel.email).toBe(null)
        expect(userModel.token).toBe(null)
      })

      it('should show failed user message on failed login', async () => {
        dataGateway.post = jest.fn().mockImplementation((path) => {
          return Promise.resolve(GetFailedUserLoginStub())
        })

        expect(loginRegisterPresenter.showValidationWarning).toBe(false)
        expect(loginRegisterPresenter.messages).toEqual([])

        loginRegisterPresenter.email = 'a@b.com'
        loginRegisterPresenter.password = '123'
        await loginRegisterPresenter.login()

        expect(loginRegisterPresenter.showValidationWarning).toBe(true)
        expect(loginRegisterPresenter.messages).toEqual(['Failed: no user record.'])
      })

      it('should clear messages on route change', async () => {
        // Force message
        const loginRegisterPresenter = await appTestHarness.setupLogin(GetFailedUserLoginStub, 'login')

        expect(loginRegisterPresenter.showValidationWarning).toBe(true)
        expect(loginRegisterPresenter.messages).toEqual(['Failed: no user record.'])

        loginRegisterPresenter.logOut()

        //TODO: Why is the showValidationWarning true?
        expect(loginRegisterPresenter.showValidationWarning).toBe(true)
        expect(loginRegisterPresenter.messages).toEqual([])

        expect(routerGateway.goToId).toHaveBeenLastCalledWith('loginLink')
      })

      it('should logout', async () => {
        const loginRegisterPresenter = await appTestHarness.setupLogin(GetSuccessfulUserLoginStub, 'login')

        expect(routerGateway.goToId).toHaveBeenLastCalledWith('homeLink')

        expect(userModel.email).toBe('a@b.com')
        expect(userModel.token).toBe('a@b1234.com')

        await loginRegisterPresenter.logOut()

        expect(userModel.email).toBe('')
        expect(userModel.token).toBe('')

        expect(routerGateway.goToId).toHaveBeenLastCalledWith('loginLink')
      })
    })
  })
})
