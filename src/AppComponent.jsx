import * as React from 'react'
import { observer } from 'mobx-react'
import { withInjection } from './Core/Providers/Injection'
import { AppPresenter } from './AppPresenter'
import { NavigationComponent } from './Navigation/NavigationComponent'
import { HomeComponent } from './Home/HomeComponent'
import { LoginRegisterComponent } from './Authentication/LoginRegisterComponent'
import { MessagesRepository } from './Core/Messages/MessagesRepository'
import { useValidation } from './Core/Providers/Validation'

export const AppComp = observer((props) => {
  const [, updateClientValidationMessages] = useValidation()

  React.useEffect(() => {
    props.presenter.load(onRouteChange)
  }, [])

  const onRouteChange = () => {
    updateClientValidationMessages([])
  }

  const renderedComponents = [
    {
      id: 'homeLink',
      component: <HomeComponent key="homePage" />
    }
  ]

  return (
    <div className="container">
      {props.presenter.currentRoute.routeId === 'loginLink' ? (
        <>
          <LoginRegisterComponent />
        </>
      ) : (
        <div className="w3-row">
          <div className="w3-col s4 w3-center">
            <NavigationComponent />
          </div>
          <div className="w3-col s8 w3-left">
            {renderedComponents.map((current) => {
              return props.presenter.currentRoute.routeId === current.id && current.component
            })}
          </div>
        </div>
      )}
    </div>
  )
})

export const AppComponent = withInjection({
  presenter: AppPresenter,
  messagesRepository: MessagesRepository
})(AppComp)
