<%@ page language="java" contentType="text/html; charset=UTF-8"
	import = "java.util.*"
	import = "org.json.simple.*"
    pageEncoding="UTF-8"%>
<%@ include file="../lib/dbInit.jsp" %>
<%
	Connection conn = null;
	String jsonString = "";
	try {
		Class.forName("com.mysql.jdbc.Driver").newInstance();
		conn = DriverManager.getConnection(dbUrl,dbUser,dbPass);
		if (conn != null) {
			Statement stmt = conn.createStatement();
/*
SELECT I.Codi, Data as Fecha, A.Nom as Nombre, A.Cognoms as Apellidos, T.Nom as Tarifa, D.Nom as Descuento, 
	IF(Tripartita, 'Sí', 'No') as Tripartita
FROM Inscripcions I
INNER JOIN Alumnes A ON A.Codi = I.Alumne
INNER JOIN Tarifes T ON T.Codi = I.Tarifa
INNER JOIN Descomptes D ON D.Codi = I.Descompte
*/
			String sSql = "SELECT I.Codi, Data as Fecha, A.Nom as Nombre, A.Cognoms as Apellidos, T.Nom as Tarifa, D.Nom as Descuento, ";
			sSql += "IF(Tripartita, 'Sí', 'No') as Tripartita ";
			sSql += "FROM Inscripcions I ";
			sSql += "INNER JOIN Alumnes A ON A.Codi = I.Alumne ";
			sSql += "INNER JOIN Tarifes T ON T.Codi = I.Tarifa ";
			sSql += "INNER JOIN Descomptes D ON D.Codi = I.Descompte";
			ResultSet res = stmt.executeQuery( sSql );

			int iNumFil = 0;
			if (res.last()) {
				iNumFil = res.getRow();
				res.beforeFirst(); // not rs.first() because the rs.next() below will move on, missing the first element
			}

//			Interface ResultSetMetaData
// 		http://docs.oracle.com/javase/6/docs/api/java/sql/ResultSetMetaData.html
			ResultSetMetaData rsmd = res.getMetaData();
			int iNumCol = rsmd.getColumnCount();

			List  l = new LinkedList();
			Map m[] = new Map[iNumFil];
			int j = 0;
			while (res.next()) {
				m[j] = new LinkedHashMap();
				for (int i = 1; i <= iNumCol; i++) {
					m[j].put( rsmd.getColumnLabel(i), res.getString(rsmd.getColumnLabel(i)) );
				}
				l.add(m[j++]);
			}
			jsonString = JSONValue.toJSONString(l);

			res.close();
			stmt.close();
			conn.close();
		}
	} catch (Exception e) {
		System.out.println("\n\n /api/inscrip.jsp -Error : "+e.getLocalizedMessage().toString());
	}
%>

<%=jsonString%>

<%
   response.setContentType("application/json");
%>