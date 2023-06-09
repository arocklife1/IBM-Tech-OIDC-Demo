import React, { useState, useEffect } from 'react';
import { Column, FlexGrid, Table, TableHead, TableHeader, TableBody, TableCell, TableRow, Content, Tile, CodeSnippet, Button } from '@carbon/react'

const LandingPage = () => {

  //sets the data constant for the page
  const [data, setData] = useState([]);

  //pulls data from the NodeJS server on page load.
  useEffect(() => {
    fetch("https://localhost:3000/data")
      .then((res) => res.json())
      .then((data) => {setData(data); console.log(data)});
  }, []);

  //sets the headers for the table on the page
  const headers = ['Attribute Name', 'Attribute Value'];

  //Sets the URL logout manually for each tenant
  const logoutURL = `${process.env.REACT_APP_TENANT_URL}/idaas/mtfim/sps/idaas/logout`

  //Returns the HTML page 
  return (
    <Content>
      <FlexGrid className="landing-page" fullWidth>
        {/* Header that displays the logged in user's username */}
        <Column lg={16} md={8} sm={4} className="landing-page__banner" gutter={5}>
          <Tile>
            <h1>Welcome {data?.userData?.displayName}</h1>
          </Tile>
        </Column>
        {/* Simple logout button using the logout URL */}
        <Column lg={16} md={8} sm={4} className="landing-page__banner" gutter={5}>
          <Tile>
            <Button href={logoutURL}>Logout</Button>
          </Tile>
        </Column>
        {/* The table of data */}
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
              <TableRow>
                <TableCell>tenantId</TableCell>
                <TableCell>{data?.userData?.ext?.tenantId}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>sub</TableCell>
                <TableCell>{data?.userData?.sub}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>acr</TableCell>
                <TableCell>{data?.userData?.acr}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>displayName</TableCell>
                <TableCell>{data?.userData?.displayName}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>realmName</TableCell>
                <TableCell>{data?.userData?.realmName}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>uniqueSecurityName</TableCell>
                <TableCell>{data?.userData?.uniqueSecurityName}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>name</TableCell>
                <TableCell>{data?.userData?.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>userType</TableCell>
                <TableCell>{data?.userData?.userType}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>access_token</TableCell>
                <TableCell>{data?.accessToken?.access_token}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>scope</TableCell>
                <TableCell>{data?.accessToken?.scope}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>grant_id</TableCell>
                <TableCell>{data?.accessToken?.grant_id}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>id_token</TableCell>
                <TableCell>{data?.accessToken?.id_token}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>token_type</TableCell>
                <TableCell>{data?.accessToken?.token_type}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>expires_in</TableCell>
                <TableCell>{data?.accessToken?.expires_in}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>expiry</TableCell>
                <TableCell>{data?.accessToken?.expiry}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Column>
        {/* Code snippet showing the raw data that can be copied. */}
        <Column lg={16} md={8} sm={4} className="landing-page__r3">
          <Tile>
            Raw Data: <CodeSnippet type="multi" feedback="Copied to clipboard">{JSON.stringify(data)}</CodeSnippet>
          </Tile>
        </Column>
      </FlexGrid>
    </Content>
  );
};

export default LandingPage;