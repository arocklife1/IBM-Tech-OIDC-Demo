import React from 'react';
import { Column, FlexGrid, Table, TableHead, TableHeader, TableBody, TableCell, TableRow, Content, Tile, Button } from '@carbon/react'

const RepoPage = () => {

  //Nothing fancy here. Simply a logout button and a few links to verify documentation

  const headers = ["Link", "Link Description"]

  return (
    <Content>
      <FlexGrid className="landing-page" fullWidth>
        <Column lg={16} md={8} sm={4} className="landing-page__banner" gutter={5}>
          <Tile>
            <Button onClick={() => window.location.href(`${process.env.REACT_APP_TENANT_URL}/idaas/mtfim/sps/idaas/logout`)}>Logout</Button>
          </Tile>
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
              <TableRow>
                <TableCell><a href='https://www.ibm.com/docs/en/security-verify?topic=sign-configuring-single-in-openid-connect-application'>https://www.ibm.com/docs/en/security-verify?topic=sign-configuring-single-in-openid-connect-application</a></TableCell>
                <TableCell>Configuring Single Sign On for an OpenID Connect Application</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><a href='https://www.ibm.com/docs/en/security-verify'>https://www.ibm.com/docs/en/security-verify</a></TableCell>
                <TableCell>IBM Security Verify Documentation</TableCell>
              </TableRow>
              <TableRow>
                <TableCell><a href='https://docs.verify.ibm.com/verify'>https://docs.verify.ibm.com/verify</a></TableCell>
                <TableCell>IBM Security Verify Documentation Hub</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Column>
      </FlexGrid>
    </Content>
  );
};

export default RepoPage;