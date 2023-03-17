import React, { useState, useEffect } from 'react';
import { Column, FlexGrid, Table, TableHead, TableHeader, TableBody, TableCell, TableRow, Content, Tile } from '@carbon/react'

const LandingPage = () => {

  const [data, setData] = useState({})
  useEffect(function () {
      const url = 'https://localhost:3000/';
      fetch(url, {
         method: 'GET',
         headers: {
             'Content-Type': 'application/json;charset=utf-8',
             'Access-Control-Allow-Origin': 'https://ryanmiller.verify.ibm.com',
             'Access-Control-Allow-Credentials': 'true',
         }
      }).then(res => {
         // fetch success

         setData(...res.data) // pass an object receive from server into setData function
      });
      console.log('data: ' + JSON.stringify(data))
      // At the first time render, console.log here will undefined
      // The second time, you will got the data
  }, []);

  const rows = [
    {
      id: 'load-balancer-1',
      name: 'Load Balancer 1',
      rule: 'Round robin',
      Status: 'Starting',
      other: 'Test',
      example: '22',
    },
    {
      id: 'load-balancer-2',
      name: 'Load Balancer 2',
      rule: 'DNS delegation',
      status: 'Active',
      other: 'Test',
      example: '22',
    },
    {
      id: 'load-balancer-3',
      name: 'Load Balancer 3',
      rule: 'Round robin',
      status: 'Disabled',
      other: 'Test',
      example: '22',
    },
    {
      id: 'load-balancer-4',
      name: 'Load Balancer 4',
      rule: 'Round robin',
      status: 'Disabled',
      other: 'Test',
      example: '22',
    },
    {
      id: 'load-balancer-5',
      name: 'Load Balancer 5',
      rule: 'Round robin',
      status: 'Disabled',
      other: 'Test',
      example: '22',
    },
    {
      id: 'load-balancer-6',
      name: 'Load Balancer 6',
      rule: 'Round robin',
      status: 'Disabled',
      other: 'Test',
      example: '22',
    },
    {
      id: 'load-balancer-7',
      name: 'Load Balancer 7',
      rule: 'Round robin',
      status: 'Disabled',
      other: 'Test',
      example: '22',
    },
  ];
  const headers = ['Name', 'Rule', 'Status', 'Other', 'Example'];

  return (
    <Content>
    <FlexGrid className="landing-page" fullWidth>
      <Column lg={16} md={8} sm={4} className="landing-page__banner" gutter={5}>
        <Tile>
          <h1>Welcome $Username</h1>
        </Tile>
      </Column>
      <Column lg={16} md={8} sm={4} className="landing-page__banner" gutter={5}>
        <Tile/>
      </Column>
      <Column lg={16} md={8} sm={4} className="landing-page__r2">
      </Column>
      <Column lg={16} md={8} sm={4} className="landing-page__r3">
        <Table size="lg" useZebraStyles={false}>
          <TableHead>
            <TableRow>
              {headers.map((header) => (
                <TableHeader id={header.key} key={header}>
                  {header}
                </TableHeader>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                {Object.keys(row)
                  .filter((key) => key !== 'id')
                  .map((key) => {
                    return <TableCell key={key}>{row[key]}</TableCell>;
                  })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Column>
    </FlexGrid>
    </Content>
  );
};

export default LandingPage;