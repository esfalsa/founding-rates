import { getAllFoundings, getTargetTime } from "@/utils/api";

export default async function Home() {
  const targetTime = getTargetTime();

  const data = await getAllFoundings(targetTime);

  const dataByRegion: { name: string; value: number }[] = [];

  for (const founding of data) {
    const regionIndex = dataByRegion.findIndex(
      (item) => item.name === founding.region
    );

    if (regionIndex === -1) {
      dataByRegion.push({
        name: founding.region,
        value: 1,
      });
    } else {
      dataByRegion[regionIndex].value++;
    }
  }

  dataByRegion.sort((a, b) => (a.value < b.value ? 1 : -1));

  const maxFoundings = Math.max(...dataByRegion.map(({ value }) => value));

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-12">
      <p>
        Showing data from {data.length} foundings between{" "}
        {new Date(data[data.length - 1].time * 1000).toLocaleString()} and{" "}
        {new Date(data[0].time * 1000).toLocaleString()}.
      </p>
      <p>Generated at {new Date().toString()}</p>
      <table>
        <thead>
          <tr>
            <th>Region</th>
            <th>Foundings</th>
            <th className="w-32">Percentage</th>
          </tr>
        </thead>
        <tbody>
          {dataByRegion.map((region) => (
            <tr key={region.name}>
              <td>
                <a
                  href={`https://www.nationstates.net/region=${encodeURIComponent(
                    region.name
                  )}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="text-blue-600"
                >
                  {region.name}
                </a>
              </td>
              <td>{region.value}</td>
              <td className="flex flex-row items-center space-x-4">
                <div className="h-1.5 w-full bg-gray-200">
                  <div
                    className="h-1.5 bg-blue-600"
                    style={{
                      width: `${Math.round(
                        (region.value / maxFoundings) * 100
                      )}%`,
                    }}
                  />
                </div>
                <span>{`${((region.value / data.length) * 100).toFixed(
                  2
                )}%`}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
