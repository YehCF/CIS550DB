import React from "react";
import { Navbar, NavbarBrand, Nav, NavItem, NavLink } from "shards-react";

class MenuBar extends React.Component {
  render() {
    return (
      <Navbar type="dark" theme="primary" expand="md">
        <NavbarBrand href="/">Polls, Pandemics and Possibly More!</NavbarBrand>
        <Nav navbar>
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
      </Navbar>
    );
  }
}

export default MenuBar;
