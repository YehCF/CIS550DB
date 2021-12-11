import React from "react";

import {
    Navbar,
    NavItem,
    NavbarToggler,
    Collapse,
    NavLink,
    Nav,
    NavbarBrand
} from 'reactstrap';

class MenuBar extends React.Component {
	constructor(props) {
        super(props)
        this.state = {
            isOpen: false
        }
		this.handleOpen = this.handleOpen.bind(this)
	}
	
	handleOpen(variable) {
        this.setState({
            isOpen : !variable
          });
    }
	
  render() {
    return (
	
		<Navbar color="dark" dark >
		
		<div style={{
            display: 'block', width: 550
        }}>
			<NavbarBrand href="/">Polls, Pandemics and Possibly More!</NavbarBrand>
			<NavbarToggler onClick={() => this.handleOpen(this.state.isOpen)} />
			<Collapse isOpen={this.state.isOpen} navbar>
				<Nav className="mr-auto" navbar>
					<NavItem>
						<NavLink active href="/">
						  Home
						</NavLink>
					  </NavItem>
					  <NavItem>
						<NavLink active href="/covid">
						  COVID19
						</NavLink>
					  </NavItem>
					  <NavItem>
						<NavLink active href="/vote">
						  Vote
						</NavLink>
					  </NavItem>
					  <NavItem>
						<NavLink active href="/stock">
						  Stock
						</NavLink>
					  </NavItem>
					  <NavItem>
						<NavLink active href="/yelp">
						  Yelp
						</NavLink>
					  </NavItem>
					</Nav>
			</Collapse>
			</div>
		</Navbar>
		
    );
  }
}

export default MenuBar;
